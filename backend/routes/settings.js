const router   = require("express").Router();
const Settings = require("../models/Settings");

router.get("/", async (_req, res) => {
  let s = await Settings.findOne();
  if (!s) s = await Settings.create({});
  res.json(s);
});

router.put("/", async (req, res) => {
  let s = await Settings.findOne();
  if (!s) s = new Settings();
  Object.assign(s, req.body);
  await s.save();
  res.json(s);
});

module.exports = router;
