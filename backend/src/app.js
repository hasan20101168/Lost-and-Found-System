const express = require("express");
const cors = require("cors");

const app = express();

const lostItemRoutes = require("./routes/lostItem.routes");
const authRoutes = require("./routes/auth.routes");

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

// Health Check Route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Lost & Found API is running",
  });
});

module.exports = app;