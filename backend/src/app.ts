import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import type { Request, Response } from "express";

import { authRouter } from "./routes/auth.routes.js";
import { roleRouter } from "./routes/role.routes.js";
import { eventRouter } from "./routes/event.routes.js";
import { ticketGroupRouter } from "./routes/ticketGroup.routes.js";
import { ticketRouter } from "./routes/ticket.routes.js";
import { seatHoldRouter } from "./routes/seatHold.routes.js";
import { posOrderRouter } from "./routes/posOrder.routes.js";


// create an express application
const app = express();

// use middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use("/uploads", express.static("uploads"));

// use routes
app.use("/api/auth", authRouter);
app.use("/api/roles", roleRouter);
app.use("/api/events", eventRouter);
app.use("/api/ticket-groups", ticketGroupRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/seat-holds", seatHoldRouter);
app.use("/api/pos-orders", posOrderRouter);

// define a simple route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, World! from Express and TypeScript!");
});

// handle 404 errors
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// export the app
export default app;
