import type { CreatePosOrderDTO } from "../schemas/posOrder.schema.ts";
import { prisma } from "../lib/primsa.ts";
import { ticketService } from "./ticket.service.ts";

// Generate unique order number: ORD-2026-0001
const generateOrderNumber = async (): Promise<string> => {
  const today = new Date();
  const year = today.getFullYear();

  // Count orders created today
  const todayStart = new Date(year, today.getMonth(), today.getDate());
  const todayEnd = new Date(year, today.getMonth(), today.getDate() + 1);

  const count = await prisma.posOrder.count({
    where: {
      createdAt: {
        gte: todayStart,
        lt: todayEnd,
      },
    },
  });
  const sequence = String(count + 1).padStart(4, "0");
  return `ORD-${year}-${today.getMonth() + 1}-${today.getDate()}-${sequence}`;
};

export const posOrderService = {
  async createOrder(data: CreatePosOrderDTO, createdById: number) {
    const orderNumber = await generateOrderNumber();

    let totalAmount = 0;
    const orderItemsData = [];
    const ticketsForTokenGeneration = [];

    // First: Generate all tickets and prepare order item data
    for (const item of data.items) {
      const tickets = await ticketService.batchGenerateTickets(
        item.ticketGroupId,
        createdById,
        item.seatType,
        item.quantity,
        item.seatNumbers
      );

      if (tickets.length === 0) {
        throw new Error(
          `Failed to generate tickets for ticket group ${item.ticketGroupId}`
        );
      }

      const subtotal = parseFloat((item.unitPrice * tickets.length).toFixed(2));
      totalAmount += subtotal;

      // Prepare data for nested create
      orderItemsData.push({
        quantity: tickets.length,
        unitPrice: item.unitPrice,
        subtotal,
        ticketGroupId: item.ticketGroupId,
        // Store ticket IDs to link later
        ticketIds: tickets.map((t) => t.id),
      });
    }

    const paymentStatus = data.paymentMethod === "CASH" ? "PAID" : "PENDING";
    const paidAt = data.paymentMethod === "CASH" ? new Date() : null;

    // Create order with nested items in ONE transaction
    const order = await prisma.posOrder.create({
      data: {
        orderNumber,
        eventId: data.eventId,
        createdById,
        totalAmount,
        currency: "USD",
        paymentMethod: data.paymentMethod,
        paymentStatus,
        paidAt,
        buyerName: data.buyerName || null,
        buyerPhone: data.buyerPhone || null,
        buyerEmail: data.buyerEmail || null,
        notes: data.notes || null,
        items: {
          create: orderItemsData.map(({ ticketIds, ...itemData }) => itemData),
        },
      },
      include: {
        items: {
          include: {
            tickets: true,
          },
        },
      },
    });

    // Now link tickets to their order items
    for (let i = 0; i < order.items.length; i++) {
      if (!orderItemsData[i]) {
        throw new Error("Missing ticket group ID for order item");
      }
      const ticketIds = orderItemsData[i]?.ticketIds;
      if (!ticketIds) {
        throw new Error("Missing ticket IDs for order item");
      }

      const orderItem = order.items[i];
      if (!orderItem) {
        throw new Error("Missing order item at index " + i);
      }

      await prisma.ticket.updateMany({
        where: {
          id: { in: ticketIds },
        },
        data: {
          orderItemId: orderItem.id,
          status: "SOLD",
        },
      });
    }

    const orderWithItems = await prisma.posOrder.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            tickets: true,
          },
        },
      },
    });
    
    if (!orderWithItems) {
      throw new Error("Failed to retrieve created order");
    }

    for (const item of orderWithItems.items) {
      ticketsForTokenGeneration.push(
        ...item.tickets.map((t) => ({
          id: t.id,
          ticketGroupId: t.ticketGroupId,
          seatNumber: t.seatNumber,
        }))
      );
    }

    await ticketService.generateQRTokensForTickets(
      ticketsForTokenGeneration,
      data.eventId,
      order.id
    );

    // Fetch complete order with tickets
    const completeOrder = await prisma.posOrder.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            tickets: true,
          },
        },
      },
    });

    return completeOrder;
  },
  async confirmPayment(orderId: number) {
    // Validate order exists
    const order = await prisma.posOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    if (order.paymentStatus === "PAID") {
      throw new Error("Order is already paid");
    }

    // Update payment status to PAID
    const updatedOrder = await prisma.posOrder.update({
      where: { id: orderId },
      data: {
        paymentStatus: "PAID",
        paidAt: new Date(),
      },
      include: {
        items: {
          include: {
            tickets: true,
          },
        },
      },
    });

    return updatedOrder;
  },

  async getOrderById(orderId: number) {
    // Fetch order with items, tickets, and event
    const order = await prisma.posOrder.findUnique({
      where: { id: orderId },
      include: {
        event: true,
        items: {
          include: {
            ticketGroup: true,
            tickets: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error("Order not found");
    }

    return order;
  },
    async getAllOrders(params?: {
    eventId?: number;
    paymentStatus?: string;
    searchQuery?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const { 
      eventId, 
      paymentStatus, 
      searchQuery, 
      startDate, 
      endDate,
      page = 1, 
      limit = 50 
    } = params || {};
    
    const where: any = {};
    
    if (eventId) {
      where.eventId = eventId;
    }
    
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }
    
    if (searchQuery) {
      where.OR = [
        { orderNumber: { contains: searchQuery } },
        { buyerName: { contains: searchQuery } },
        { buyerEmail: { contains: searchQuery } },
        { buyerPhone: { contains: searchQuery } }
      ];
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    
    const [orders, total] = await prisma.$transaction([
      prisma.posOrder.findMany({
        where,
        include: {
          event: {
            select: { id: true, name: true }
          },
          createdBy: {
            select: { id: true, username: true }
          },
          items: {
            include: {
              ticketGroup: {
                select: { name: true }
              },
              tickets: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.posOrder.count({ where })
    ]);
    
    return { orders, total, page, limit };
  },
  
  async getSalesStats(params?: {
    eventId?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { eventId, startDate, endDate } = params || {};
    
    const where: any = {};
    
    if (eventId) {
      where.eventId = eventId;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }
    
    const [
      totalOrders,
      paidOrders,
      pendingOrders,
      failedOrders,
      totalRevenue,
      paidRevenue
    ] = await Promise.all([
      prisma.posOrder.count({ where }),
      prisma.posOrder.count({ where: { ...where, paymentStatus: 'PAID' } }),
      prisma.posOrder.count({ where: { ...where, paymentStatus: 'PENDING' } }),
      prisma.posOrder.count({ where: { ...where, paymentStatus: 'FAILED' } }),
      prisma.posOrder.aggregate({
        where,
        _sum: { totalAmount: true }
      }),
      prisma.posOrder.aggregate({
        where: { ...where, paymentStatus: 'PAID' },
        _sum: { totalAmount: true }
      })
    ]);
    
    // Get tickets sold count
    const ticketsSold = await prisma.ticket.count({
      where: {
        status: { in: ['SOLD', 'USED'] },
        ...(eventId ? { ticketGroup: { eventId } } : {}),
        ...(startDate || endDate ? {
          purchasedAt: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {})
          }
        } : {})
      }
    });
    
    return {
      totalOrders,
      paidOrders,
      pendingOrders,
      failedOrders,
      ticketsSold,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      paidRevenue: paidRevenue._sum.totalAmount || 0
    };
  },
  
  async deleteOrder(orderId: number) {
    const order = await prisma.posOrder.findUnique({
      where: { id: orderId },
      include: { items: true }
    });
  
    if (!order) {
      throw new Error("Order not found");
    }
  
    // Only allow deletion of pending/failed orders
    if (order.paymentStatus === 'PAID') {
      throw new Error("Cannot delete paid orders. Please refund instead.");
    }
  
    // Delete order (cascade will delete items and unlink tickets)
    await prisma.posOrder.delete({
      where: { id: orderId }
    });
  
    return { message: "Order deleted successfully" };
  },
  
  async refundOrder(orderId: number) {
    const order = await prisma.posOrder.findUnique({
      where: { id: orderId }
    });
  
    if (!order) {
      throw new Error("Order not found");
    }
  
    if (order.paymentStatus !== 'PAID') {
      throw new Error("Only paid orders can be refunded");
    }
  
    const updatedOrder = await prisma.posOrder.update({
      where: { id: orderId },
      data: {
        paymentStatus: 'REFUNDED'
      },
      include: {
        items: {
          include: {
            tickets: true
          }
        }
      }
    });
  
    // Mark all tickets as available again
    const ticketIds = updatedOrder.items.flatMap(item => 
      item.tickets.map(t => t.id)
    );
  
    await prisma.ticket.updateMany({
      where: { id: { in: ticketIds } },
      data: { 
        status: 'AVAILABLE',
        purchasedById: null,
        purchasedAt: null,
        qrToken: null
      }
    });
  
    return updatedOrder;
  }
};
