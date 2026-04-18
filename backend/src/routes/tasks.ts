import { Router } from "express";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from "../services/taskService.js";
import type { TaskCreateInput, TaskUpdateInput } from "../types.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

tasksRouter.get("/", async (req, res) => {
  try {
    const userId = req.userId!;
    const forDate = req.query.forDate as string | undefined;
    const fromDate = req.query.fromDate as string | undefined;
    const toDate = req.query.toDate as string | undefined;
    const outstanding = req.query.outstanding === "true";

    const tasks = await getTasks(userId, {
      forDate,
      fromDate,
      toDate,
      outstanding,
    });
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

tasksRouter.post("/", async (req, res) => {
  try {
    const body = req.body as TaskCreateInput;
    if (!body.title || typeof body.title !== "string") {
      res.status(400).json({ error: "title is required" });
      return;
    }
    const task = await createTask(req.userId!, {
      title: body.title,
      forDate: body.forDate ?? null,
      notes: body.notes ?? null,
    });
    res.status(201).json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create task" });
  }
});

tasksRouter.patch("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body as TaskUpdateInput;
    const task = await updateTask(req.userId!, id, body);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(task);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update task" });
  }
});

tasksRouter.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const deleted = await deleteTask(req.userId!, id);
    if (!deleted) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete task" });
  }
});
