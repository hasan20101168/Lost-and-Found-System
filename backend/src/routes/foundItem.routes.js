const express = require("express");

const router = express.Router();

const {
  createFoundItem,
  getAllFoundItems,
  getFoundItemFilters,
  getFoundItemById,
  getMyFoundItems,
  updateFoundItem,
  deleteFoundItem
} = require("../controllers/foundItem.controller");

const auth = require("../middlewares/auth.middleware");
const upload = require("../middlewares/upload.middleware");

router.get("/", getAllFoundItems);
router.get("/filters", getFoundItemFilters);
router.get(
  "/my-items",
  auth,
  getMyFoundItems
);
router.get("/:id", getFoundItemById);

router.post(
  "/",
  auth,
  upload.single("image"),
  createFoundItem
);
router.put("/:id", auth, updateFoundItem);
router.delete("/:id", auth, deleteFoundItem);

module.exports = router;
