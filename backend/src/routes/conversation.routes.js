const express = require("express");

const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const {
  createConversation,
  getConversations,
  getMessages,
  createMessage
} = require("../controllers/conversation.controller");

router.use(auth);

router.post("/", createConversation);
router.get("/", getConversations);
router.get("/:id/messages", getMessages);
router.post("/:id/messages", createMessage);

module.exports = router;
