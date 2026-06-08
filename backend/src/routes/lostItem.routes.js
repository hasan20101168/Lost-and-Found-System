const express = require("express");

const router = express.Router();

const {
  createLostItem,
  getAllLostItems,
  getLostItemById,
  updateLostItem,
  deleteLostItem,
  getMyLostItems
} = require("../controllers/lostItem.controller");

const auth = require("../middlewares/auth.middleware");

// Public routes
router.get("/", getAllLostItems);
router.get(
  "/my-items",
  auth,
  getMyLostItems
);
router.get("/:id", getLostItemById);

// Protected routes
router.post("/", auth, createLostItem);
router.put("/:id", auth, updateLostItem);
router.delete("/:id", auth, deleteLostItem);

module.exports = router;