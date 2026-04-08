require("dotenv").config();
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const path     = require("path");

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

// static dashboard
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.use("/api/users",      require("./routes/users"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/settings",   require("./routes/settings"));
app.use("/api/enroll",     require("./routes/enroll"));

// health check (Render uses this)
app.get("/healthz", (_req, res) => res.json({ ok: true }));

const PORT      = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("\n  ✗ MONGO_URI is not set.\n");
  console.error("  → Local:  create backend/.env with MONGO_URI=...");
  console.error("  → Cloud:  set MONGO_URI as an env var on Render.\n");
  console.error("  Get a free MongoDB Atlas connection string at:");
  console.error("  https://www.mongodb.com/cloud/atlas\n");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("  ✓ MongoDB Atlas connected");
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`  ✓ Dashboard:  http://localhost:${PORT}`);
      console.log(`  ✓ API:        http://localhost:${PORT}/api\n`);
    });
  })
  .catch((err) => {
    console.error("  ✗ MongoDB connection failed:", err.message);
    process.exit(1);
  });
