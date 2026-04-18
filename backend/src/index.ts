import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __backendDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__backendDir, "../.env") });
import express from "express";
import cors from "cors";
import { tasksRouter } from "./routes/tasks.js";
import { settingsRouter } from "./routes/settings.js";
import { authRouter } from "./routes/auth.js";

const app = express();
const PORT = process.env.PORT ?? 4000;

const frontendDist = path.join(__backendDir, "../../frontend/dist");

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/settings", settingsRouter);

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Taskmaster listening on port ${PORT}`);
});
