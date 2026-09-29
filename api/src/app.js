const express = require("express");
const cors = require("cors");

function isNonEmptyString(v, min, max) {
  return typeof v === "string" && v.trim().length >= min && v.trim().length <= max;
}

function isValidDate(v) {
  return typeof v === "string" && !Number.isNaN(Date.parse(v));
}

const VALID_STATUSES = new Set(["pending", "approved", "rejected"]);

function createApp({ allowedOrigin = process.env.ALLOWED_ORIGIN || "http://localhost:3000" } = {}) {
  const app = express();
  app.use(express.json());
  app.use(
    cors({
      origin: allowedOrigin,
      methods: ["GET", "POST", "PATCH"],
    })
  );

  // ---- In-memory store (documented in README). Reset per process, not persisted.
  let nextId = 4;
  const requests = [
    {
      id: 1,
      requesterName: "Ana Torres",
      destination: "Buenos Aires, AR",
      startDate: "2026-10-06",
      endDate: "2026-10-09",
      reason: "Client kickoff meeting for the Q4 rollout.",
      status: "pending",
      createdAt: "2026-09-20T10:00:00.000Z",
    },
    {
      id: 2,
      requesterName: "Marco Bittner",
      destination: "Bogota, CO",
      startDate: "2026-09-20",
      endDate: "2026-09-22",
      reason: "Regional sales conference, booth staffing.",
      status: "approved",
      createdAt: "2026-09-15T09:30:00.000Z",
      decisionNote: "Approved, standard per-diem applies.",
    },
    {
      id: 3,
      requesterName: "Ingrid Solano",
      destination: "Miami, US",
      startDate: "2026-11-02",
      endDate: "2026-11-03",
      reason: "Vendor contract negotiation on site.",
      status: "rejected",
      createdAt: "2026-09-18T14:15:00.000Z",
      decisionNote: "Can be handled remotely this quarter.",
    },
  ];

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "platform-api", time: new Date().toISOString() });
  });

  app.get("/requests", (_req, res) => {
    const sorted = [...requests].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    res.json({ items: sorted });
  });

  app.get("/requests/:id", (req, res) => {
    const id = Number(req.params.id);
    const item = requests.find((r) => r.id === id);
    if (!item) return res.status(404).json({ error: "Request not found." });
    res.json(item);
  });

  app.post("/requests", (req, res) => {
    const { requesterName, destination, startDate, endDate, reason } = req.body || {};

    if (!isNonEmptyString(requesterName, 2, 80)) {
      return res.status(400).json({ error: "Invalid requesterName." });
    }
    if (!isNonEmptyString(destination, 2, 80)) {
      return res.status(400).json({ error: "Invalid destination." });
    }
    if (!isNonEmptyString(reason, 10, 500)) {
      return res.status(400).json({ error: "Invalid reason." });
    }
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return res.status(400).json({ error: "Invalid startDate/endDate." });
    }
    if (Date.parse(startDate) > Date.parse(endDate)) {
      return res.status(400).json({ error: "startDate must be before or equal to endDate." });
    }

    const item = {
      id: nextId++,
      requesterName: requesterName.trim(),
      destination: destination.trim(),
      startDate,
      endDate,
      reason: reason.trim(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    requests.unshift(item);
    res.status(201).json(item);
  });

  app.patch("/requests/:id", (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: "Invalid id." });
    }

    const item = requests.find((r) => r.id === id);
    if (!item) return res.status(404).json({ error: "Request not found." });

    const { status, decisionNote } = req.body || {};

    if (status === undefined || typeof status !== "string" || !VALID_STATUSES.has(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }
    if (status === "pending") {
      return res.status(400).json({ error: "Cannot transition back to pending." });
    }
    if (item.status !== "pending") {
      return res.status(409).json({
        error: `Request is already ${item.status} and cannot be changed.`,
      });
    }
    if (decisionNote !== undefined && (typeof decisionNote !== "string" || decisionNote.trim().length > 500)) {
      return res.status(400).json({ error: "Invalid decisionNote." });
    }

    item.status = status;
    if (decisionNote !== undefined) {
      item.decisionNote = decisionNote.trim();
    }

    res.json(item);
  });

  return app;
}

module.exports = { createApp };
