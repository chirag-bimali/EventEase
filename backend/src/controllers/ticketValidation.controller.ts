import type { Request, Response, NextFunction } from "express";
import { qrTokenService } from "../services/qrToken.service.ts";
import { prisma } from "../lib/primsa.ts";

export const validateTicket = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("Received ticket validation request:", req.body);
    const { qrToken } = req.body;
    if (!qrToken) {
      return res.status(400).json({ message: "QR token is required" });
    }

    const validatorUserId = (req as any).user?.userId;
    if (!validatorUserId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if user has VALIDATOR role
    const user = await (req as any).user;
    // You can add role checking here if needed

    const result = await qrTokenService.validateTicket(
      qrToken,
      validatorUserId
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      ticketData: result.ticketData,
    });
  } catch (error) {
    next(error);
  }
};

export const getTicketStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { qrToken } = req.params;
    if (!qrToken) {
      return res.status(400).json({ message: "QR token is required" });
    }

    const decodedToken = qrTokenService.verifyQRToken(qrToken);
    if (!decodedToken) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired QR code",
      });
    }

    // Fetch ticket info (don't validate, just check status)
    const ticket = await prisma.ticket.findUnique({
      where: { id: decodedToken.ticketId },
      include: {
        ticketGroup: { include: { event: true } },
        validator: { select: { username: true } },
      },
    });

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    return res.json({
      ticketId: ticket.id,
      seatNumber: ticket.seatNumber,
      status: ticket.status,
      validatedAt: ticket.validatedAt,
      validatedBy: ticket.validator?.username,
      eventName: ticket.ticketGroup.event.name,
      groupName: ticket.ticketGroup.name,
    });
  } catch (error) {
    next(error);
  }
};