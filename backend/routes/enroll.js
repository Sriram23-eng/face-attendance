/**
 * Enrollment bridge between the web UI and the Raspberry Pi.
 */
const router = require("express").Router();
const User   = require("../models/User");

const pending = [];
let nextId = 1;

router.post("/request", async (req, res) => {
  const { type } = req.body;
  if (!["rfid", "finger"].includes(type))
    return res.status(400).json({ error: "type must be rfid|finger" });

  let slot = null;
  if (type === "finger") {
    const max = await User.findOne({ fingerId: { $exists: true, $ne: null } })
      .sort({ fingerId: -1 }).lean();
    slot = (max?.fingerId || 0) + 1;
  }

  const item = {
    id: nextId++, type, slot,
    status: "pending", value: null,
    createdAt: Date.now(),
  };
  pending.push(item);
  res.json({ id: item.id, slot });
});

router.get("/pending", (_req, res) => {
  const item = pending.find((p) => p.status === "pending");
  if (!item) return res.json(null);
  item.status = "in_progress";
  res.json({ id: item.id, type: item.type, slot: item.slot });
});

router.post("/result", (req, res) => {
  const { id, value, ok } = req.body;
  const item = pending.find((p) => p.id === id);
  if (!item) return res.status(404).json({ error: "unknown id" });
  item.status = ok === false ? "failed" : "done";
  item.value  = value;
  res.json({ ok: true });
});

router.get("/status/:id", (req, res) => {
  const item = pending.find((p) => p.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: "unknown id" });
  res.json({ status: item.status, value: item.value, slot: item.slot });
});

router.post("/cancel/:id", (req, res) => {
  const item = pending.find((p) => p.id === Number(req.params.id));
  if (item && item.status !== "done") item.status = "cancelled";
  res.json({ ok: true });
});

setInterval(() => {
  const cutoff = Date.now() - 10 * 60 * 1000;
  for (let i = pending.length - 1; i >= 0; i--)
    if (pending[i].createdAt < cutoff) pending.splice(i, 1);
}, 5 * 60 * 1000);

module.exports = router;
