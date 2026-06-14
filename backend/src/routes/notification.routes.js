const express = require("express");

const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead
} = require("../controllers/notification.controller");

router.use(auth);

router.get("/", getNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

module.exports = router;
