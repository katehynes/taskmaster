import { Router } from "express";
import { getTasks, createTask, updateTask, deleteTask, } from "../services/taskService.js";
export const tasksRouter = Router();
tasksRouter.get("/", async (req, res) => {
    try {
        const forDate = req.query.forDate;
        const fromDate = req.query.fromDate;
        const toDate = req.query.toDate;
        const includeExpired = req.query.includeExpired === "true";
        const tasks = await getTasks({
            forDate,
            fromDate,
            toDate,
            includeExpired,
        });
        res.json(tasks);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch tasks" });
    }
});
tasksRouter.post("/", async (req, res) => {
    try {
        const body = req.body;
        if (!body.title || !body.forDate) {
            res.status(400).json({ error: "title and forDate are required" });
            return;
        }
        const task = await createTask({
            title: body.title,
            forDate: body.forDate,
            notes: body.notes ?? null,
        });
        res.status(201).json(task);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create task" });
    }
});
tasksRouter.patch("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const body = req.body;
        const task = await updateTask(id, body);
        if (!task) {
            res.status(404).json({ error: "Task not found" });
            return;
        }
        res.json(task);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to update task" });
    }
});
tasksRouter.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const deleted = await deleteTask(id);
        if (!deleted) {
            res.status(404).json({ error: "Task not found" });
            return;
        }
        res.status(204).send();
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete task" });
    }
});
