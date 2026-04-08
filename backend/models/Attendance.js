const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    method:    { type: String, enum: ["face", "finger", "rfid"], required: true },
    timestamp: { type: Date, required: true, default: Date.now },
    deviceId:  String,
    type:      { type: String, enum: ["in", "out"], default: "in" },
  },
  { timestamps: true }
);

AttendanceSchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.model("Attendance", AttendanceSchema);
