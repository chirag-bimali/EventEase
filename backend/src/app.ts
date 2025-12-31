import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import type { Request, Response } from "express";

import { authRouter } from "./routes/auth.routes.js";
import { roleRouter } from "./routes/role.routes.js";
import { eventRouter } from "./routes/event.routes.js";


// create an express application
const app = express();

// use middleware
app.use(cors());
app.use(express.json());

// use routes
app.use("/api/auth", authRouter);
app.use("/api/roles", roleRouter);
app.use("/api/events", eventRouter);

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
