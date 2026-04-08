const router     = require("express").Router();
const Attendance = require("../models/Attendance");

router.post("/", async (req, res) => {
  try {
    const { userId, method, timestamp, deviceId } = req.body;
    const rec = await Attendance.create({
      userId, method, deviceId,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
    });
    res.status(201).json(rec);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.get("/", async (req, res) => {
  const { from, to, userId } = req.query;
  const q = {};
  if (userId) q.userId = userId;
  if (from || to) {
    q.timestamp = {};
    if (from) q.timestamp.$gte = new Date(from);
    if (to)   q.timestamp.$lte = new Date(to);
  }
  const rows = await Attendance.find(q)
    .sort({ timestamp: -1 })
    .limit(500)
    .populate("userId", "name employeeId")
    .lean();
  res.json(rows);
});

router.get("/summary/:userId", async (req, res) => {
  const { from, to } = req.query;
  const start = from ? new Date(from) : new Date(Date.now() - 30 * 86400000);
  const end   = to   ? new Date(to)   : new Date();

  const rows = await Attendance.find({
    userId: req.params.userId,
    timestamp: { $gte: start, $lte: end },
  }).lean();

  const presentDays = new Set(
    rows.map((r) => new Date(r.timestamp).toISOString().slice(0, 10))
  );
  let workingDays = 0;
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() !== 0) workingDays++;
  }
  res.json({
    userId: req.params.userId, from: start, to: end,
    workingDays,
    present: presentDays.size,
    absent:  Math.max(0, workingDays - presentDays.size),
    records: rows,
  });
});

module.exports = router;
