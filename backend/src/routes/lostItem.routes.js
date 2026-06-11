const express = require("express");

const router = express.Router();

const {
  createLostItem,
  getAllLostItems,
  getLostItemFilters,
  getLostItemById,
  updateLostItem,
  deleteLostItem,
  getMyLostItems
} = require("../controllers/lostItem.controller");

const auth = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

// Public routes
router.get("/", getAllLostItems);
router.get("/filters", getLostItemFilters);
router.get(
  "/my-items",
  auth,
  getMyLostItems
);
router.get("/:id", getLostItemById);

// Protected routes
router.post(
  "/",
  auth,
  upload.single("image"),
  createLostItem
);
router.put("/:id", auth, updateLostItem);
router.delete("/:id", auth, deleteLostItem);

module.exports = router;
