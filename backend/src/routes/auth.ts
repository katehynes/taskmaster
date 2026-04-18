import { Router } from "express";
import { loginUser, registerUser } from "../services/authService.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const { user, token } = await registerUser(email, password);
    res.status(201).json({ user, token });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Registration failed";
    if (msg.includes("already exists")) {
      res.status(409).json({ error: msg });
      return;
    }
    if (
      msg.includes("Invalid email") ||
      msg.includes("Password must") ||
      msg.includes("at least")
    ) {
      res.status(400).json({ error: msg });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Registration failed" });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }
    const { user, token } = await loginUser(email, password);
    res.json({ user, token });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Login failed";
    if (msg === "Invalid email or password") {
      res.status(401).json({ error: msg });
      return;
    }
    if (msg.includes("Invalid email") || msg.includes("required")) {
      res.status(400).json({ error: msg });
      return;
    }
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json({
    user: { id: req.userId, email: req.userEmail },
  });
});
