import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../auth/jwt.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  try {
    const { userId, email } = await verifyAccessToken(token);
    req.userId = userId;
    req.userEmail = email;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired session" });
  }
}
