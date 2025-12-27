import type { Request, Response, NextFunction } from "express";

export const login = (req: Request, res: Response, next: NextFunction) => {
  // Dummy implementation for login
  const { username, password } = req.body;

  if (username === "admin" && password === "password") {
    res.status(200).json({ message: "Login successful" });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
};
