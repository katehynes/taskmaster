import express from "express";
import cors from "cors";
import { tasksRouter } from "./routes/tasks.js";
import { settingsRouter } from "./routes/settings.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/tasks", tasksRouter);
app.use("/api/settings", settingsRouter);

app.listen(PORT, () => {
  console.log(`Taskmaster API listening on http://localhost:${PORT}`);
});
