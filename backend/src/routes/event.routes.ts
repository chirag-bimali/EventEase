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
import { upload } from "../middlewares/upload.middleware.ts";

export const eventRouter = Router();

// Event routes
eventRouter.get("/", getAllEvents);
eventRouter.get("/:id", getEventById);
eventRouter.post("/", authMiddleware, createEvent);
eventRouter.post(
  "/upload-image",
  authMiddleware,
  upload.single("image"),
  uploadEventImage as RequestHandler
);

eventRouter.patch("/:id", authMiddleware, updateEvent);
eventRouter.delete("/:id", authMiddleware, deleteEvent);
