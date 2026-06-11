const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();

const lostItemRoutes = require("./routes/lostItem.routes");
const foundItemRoutes = require("./routes/foundItem.routes");
const authRoutes = require("./routes/auth.routes");
const matchRoutes = require("./routes/match.routes");
const claimRequestRoutes = require("./routes/claimRequest.routes");

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/lost-items", lostItemRoutes);
app.use("/api/found-items", foundItemRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/claims", claimRequestRoutes);

// Health Check Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Lost & Found API is running",
  });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      message:
        err.code === "LIMIT_FILE_SIZE"
          ? "Image must be smaller than 5MB"
          : err.message
    });
  }

  if (err.message === "Only image files are allowed") {
    return res.status(400).json({
      message: err.message
    });
  }

  next(err);
});

module.exports = app;
