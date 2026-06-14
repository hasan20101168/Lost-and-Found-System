const express = require("express");

const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const requireRole = require("../middlewares/role.middleware");
const {
  getMetrics,
  getUsers,
  deleteUser,
  getPosts,
  deletePost,
  getClaims,
  getReports,
  updateReportStatus
} = require("../controllers/admin.controller");

router.use(auth, requireRole("ADMIN"));

router.get("/metrics", getMetrics);
router.get("/users", getUsers);
router.delete("/users/:id", deleteUser);
router.get("/posts", getPosts);
router.delete("/posts/:type/:id", deletePost);
router.get("/claims", getClaims);
router.get("/reports", getReports);
router.patch(
  "/reports/:id/status",
  updateReportStatus
);

module.exports = router;
