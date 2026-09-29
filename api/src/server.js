const express = require("express");
const cors = require("cors");

const app = express();
app.use(express.json());

const allowedOrigin = process.env.ALLOWED_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PATCH"],
  })
);

// ---- In-memory store (documented in README)
let nextId = 4;
const tasks = [
  { id: 1, title: "Investigate customer-reported issue", status: "open", createdAt: new Date().toISOString() },
  { id: 2, title: "Reproduce bug and write steps", status: "in_progress", createdAt: new Date().toISOString() },
  { id: 3, title: "Ship fix + release notes", status: "done", createdAt: new Date().toISOString() },
];

const VALID_STATUSES = new Set(["open", "in_progress", "done"]);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api", time: new Date().toISOString() });
});

app.get("/tasks", (_req, res) => {
  res.json({ items: tasks });
});

app.post("/tasks", (req, res) => {
  const { title } = req.body || {};
  if (!title || typeof title !== "string" || title.trim().length < 3) {
    return res.status(400).json({
      error: "Invalid title. Provide a string with at least 3 characters.",
    });
  }

  const item = {
    id: nextId++,
    title: title.trim(),
    status: "open",
    createdAt: new Date().toISOString(),
  };

  tasks.unshift(item);
  res.status(201).json(item);
});

app.patch("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return res.status(400).json({ error: "Invalid id." });
  }

  const { status, title } = req.body || {};
  const item = tasks.find((t) => t.id === id);

  if (!item) return res.status(404).json({ error: "Task not found." });

  if (status !== undefined) {
    if (typeof status !== "string" || !VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }
    item.status = status;
  }

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length < 3) {
      return res.status(400).json({ error: "Invalid title." });
    }
    item.title = title.trim();
  }

  res.json(item);
});

const port = Number(process.env.PORT || 4000);
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
  console.log(`CORS allowed origin: ${allowedOrigin}`);
});
