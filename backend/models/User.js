const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true },
    employeeId: { type: String, unique: true, required: true },
    rfid:       { type: String, index: true },
    fingerId:   { type: Number, index: true },
    /**
     * Face image stored as a base64 data URL string.
     * Excluded by default (select:false) so listing endpoints stay small.
     * Pi pulls it explicitly via /api/users/sync.
     */
    faceImage:  { type: String, select: false },
    hasFace:    { type: Boolean, default: false },
    email:      String,
    department: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
