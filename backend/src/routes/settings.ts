import { Router } from "express";
import { getSettings, updateSettings } from "../services/settingsService.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

settingsRouter.get("/", async (req, res) => {
  try {
    const settings = await getSettings(req.userId!);
    res.json({ expirationDays: settings.expirationDays });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

settingsRouter.patch("/", async (req, res) => {
  try {
    const { expirationDays } = req.body as { expirationDays?: number };
    if (typeof expirationDays !== "number" || expirationDays < 0) {
      res.status(400).json({ error: "expirationDays must be a non-negative number" });
      return;
    }
    const settings = await updateSettings(req.userId!, { expirationDays });
    res.json({ expirationDays: settings.expirationDays });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update settings" });
  }
});
