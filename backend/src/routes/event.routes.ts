import { Router, type RequestHandler } from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  uploadEventImage,
} from "../controllers/event.controller.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { adminAuthMiddleware } from "../middlewares/adminAuth.middleware.ts";
import { upload } from "../middlewares/upload.middleware.ts";

export const eventRouter = Router();

// Event routes
eventRouter.get("/", getAllEvents);
eventRouter.get("/:id", getEventById);
eventRouter.post("/", authMiddleware, adminAuthMiddleware, createEvent);
eventRouter.post(
  "/upload-image",
  authMiddleware,
  adminAuthMiddleware,
  upload.single("image"),
  uploadEventImage as RequestHandler
);

eventRouter.patch("/:id", authMiddleware, adminAuthMiddleware, updateEvent);
eventRouter.delete("/:id", authMiddleware, adminAuthMiddleware, deleteEvent);
