import express from "express";
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  sendMessage,
} from "../controllers/chatController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/conversations", authMiddleware, getConversations);
router.post("/conversations", authMiddleware, getOrCreateConversation);
router.get("/conversations/:id/messages", authMiddleware, getMessages);
router.post("/conversations/:id/messages", authMiddleware, sendMessage);

export default router;
