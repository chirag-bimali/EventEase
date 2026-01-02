import type { CreatePosOrderDTO } from "../schemas/posOrder.schema.js";
import { prisma } from "../lib/primsa.js";
import { ticketService } from "./ticket.service.js";

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
  return `ORD-${year}-${sequence}`;
};

export const posOrderService = {
  async createOrder(data: CreatePosOrderDTO, createdById: number) {
    // Generate unique orderNumber
    const orderNumber = await generateOrderNumber();
    
    let totalAmount = 0;
    const createdItems = [];
    const allTickets = [];

    // For each item: batch generate tickets, calculate subtotal, create PosOrderItem
    for (const item of data.items) {
      // Batch generate tickets for this group
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

      // Calculate subtotal for this item
      const subtotal = parseFloat(
        (item.unitPrice * tickets.length).toFixed(2)
      );
      totalAmount += subtotal;

      // Create PosOrderItem record
      const orderItem = await prisma.posOrderItem.create({
        data: {
          quantity: tickets.length,
          unitPrice: item.unitPrice,
          subtotal,
          ticketGroupId: item.ticketGroupId,
          orderId: 0,
        },
      });

      // Link tickets to this order item
      await prisma.ticket.updateMany({
        where: {
          id: { in: tickets.map((t) => t.id) },
        },
        data: {
          orderItemId: orderItem.id,
          status: "SOLD",
        },
      });

      createdItems.push(orderItem);
      allTickets.push(...tickets);
    }

    // Determine payment status based on payment method
    const paymentStatus =
      data.paymentMethod === "CASH" ? "PAID" : "PENDING";
    const paidAt =
      data.paymentMethod === "CASH" ? new Date() : null;

    // Create PosOrder
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
      },
    });

    // Link order items to the order
    await prisma.posOrderItem.updateMany({
      where: {
        id: { in: createdItems.map((item) => item.id) },
      },
      data: {
        orderId: order.id,
      },
    });

    // Fetch complete order with items and tickets
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