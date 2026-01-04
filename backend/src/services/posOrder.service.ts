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
};
