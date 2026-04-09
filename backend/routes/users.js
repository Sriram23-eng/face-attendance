const router = require("express").Router();
const User   = require("../models/User");

// Public list — excludes the heavy faceImage field.
router.get("/", async (_req, res) => {
  const users = await User.find().sort({ createdAt: -1 }).lean();
  res.json(users);
});

// Pi-side sync — includes the base64 face for recognition.
router.get("/sync", async (_req, res) => {
  const users = await User.find().select("+faceImage").lean();
  res.json(users);
});

// Browser-side: fetch one user's face image as a JPEG (binary).
router.get("/:id/face", async (req, res) => {
  const u = await User.findById(req.params.id).select("+faceImage").lean();
  if (!u || !u.faceImage) return res.status(404).end();
  const m = u.faceImage.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!m) return res.status(404).end();
  res.type(`image/${m[1]}`).send(Buffer.from(m[2], "base64"));
});

router.get("/:id", async (req, res) => {
  const u = await User.findById(req.params.id).lean();
  if (!u) return res.status(404).json({ error: "not found" });
  res.json(u);
});

router.post("/", async (req, res) => {
  try {
    const {
      name, employeeId, rfid, fingerId,
      email, department, faceImageBase64, faceImage,
    } = req.body;

    const face = faceImageBase64 || faceImage;
    const u = await User.create({
      name, employeeId, rfid,
      fingerId: fingerId ? Number(fingerId) : undefined,
      email, department,
      faceImage: face || undefined,
      hasFace:   !!face,
    });
    const obj = u.toObject();
    delete obj.faceImage;
    res.status(201).json(obj);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Update existing user (used to attach RFID/finger after enrollment)
router.put("/:id", async (req, res) => {
  try {
    const { rfid, fingerId, faceImageBase64, faceImage } = req.body;
    const upd = {};
    if (rfid !== undefined) upd.rfid = rfid;
    if (fingerId !== undefined) upd.fingerId = Number(fingerId);
    const face = faceImageBase64 || faceImage;
    if (face) { upd.faceImage = face; upd.hasFace = true; }
    const u = await User.findByIdAndUpdate(req.params.id, upd, { new: true }).lean();
    if (u) delete u.faceImage;
    res.json(u);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete("/:id", async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
