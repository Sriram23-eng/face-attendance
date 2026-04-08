const mongoose = require("mongoose");

const SettingsSchema = new mongoose.Schema({
  morningStart: { type: String, default: "09:00" },
  morningEnd:   { type: String, default: "09:30" },
  returnStart:  { type: String, default: "17:00" },
  returnEnd:    { type: String, default: "17:30" },
  workingDays:  { type: [Number], default: [1, 2, 3, 4, 5, 6] },
  holidays:     { type: [String], default: [] },
});

module.exports = mongoose.model("Settings", SettingsSchema);
