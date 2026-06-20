import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import { createNotification } from "../utils/notificationHelper.js";

export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate("participants", "name profileImage isOnline lastSeen")
      .populate("product", "title images price")
      .sort({ lastMessageAt: -1 });

    const formatted = conversations.map((c) => {
      const other = c.participants.find((p) => p._id.toString() !== req.user._id.toString());
      const unread = c.unreadCount?.[req.user._id.toString()] || 0;
      return { ...c.toObject(), otherUser: other, unreadCount: unread };
    });

    return res.json({ success: true, conversations: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getOrCreateConversation = async (req, res) => {
  try {
    const { sellerId, productId } = req.body;
    if (!sellerId) return res.status(400).json({ success: false, message: "Seller ID required" });

    let conversation = await Conversation.findOne({
      participants: { $all: [req.user._id, sellerId] },
      product: productId || null,
    })
      .populate("participants", "name profileImage isOnline")
      .populate("product", "title images");

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user._id, sellerId],
        product: productId || null,
      });
      conversation = await Conversation.findById(conversation._id)
        .populate("participants", "name profileImage isOnline")
        .populate("product", "title images");
    }

    return res.json({ success: true, conversation });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation?.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const messages = await Message.find({ conversation: req.params.id })
      .populate("sender", "name profileImage")
      .sort({ createdAt: 1 });

    const unreadCount = conversation.unreadCount || {};
    unreadCount[req.user._id.toString()] = 0;
    conversation.unreadCount = unreadCount;
    await conversation.save();

    await Message.updateMany(
      { conversation: req.params.id, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    return res.json({ success: true, messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { content, image } = req.body;
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation?.participants.some((p) => p.toString() === req.user._id.toString())) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const message = await Message.create({
      conversation: req.params.id,
      sender: req.user._id,
      content: content || "",
      image: image || "",
      readBy: [req.user._id],
    });

    conversation.lastMessage = content || "📷 Image";
    conversation.lastMessageAt = new Date();

    for (const participantId of conversation.participants) {
      const pid = participantId.toString();
      if (pid !== req.user._id.toString()) {
        const current = conversation.unreadCount?.[pid] || 0;
        conversation.unreadCount = conversation.unreadCount || {};
        conversation.unreadCount[pid] = current + 1;

        await createNotification({
          userId: participantId,
          title: "New message",
          message: content?.slice(0, 80) || "Sent you an image",
          type: "message",
          link: `/chat?conversation=${req.params.id}`,
        });
      }
    }

    await conversation.save();

    const populated = await Message.findById(message._id).populate("sender", "name profileImage");
    return res.status(201).json({ success: true, message: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const setupSocket = (io) => {
  io.on("connection", async (socket) => {
    const userId = socket.handshake.auth?.userId;
    if (userId) {
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      socket.join(`user:${userId}`);
      io.emit("user:online", { userId });
    }

    socket.on("join:conversation", (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("message:send", async ({ conversationId, content, image }) => {
      if (!userId || !conversationId) return;

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) return;

      const message = await Message.create({
        conversation: conversationId,
        sender: userId,
        content: content || "",
        image: image || "",
        readBy: [userId],
      });

      conversation.lastMessage = content || "📷 Image";
      conversation.lastMessageAt = new Date();
      await conversation.save();

      const populated = await Message.findById(message._id).populate("sender", "name profileImage");
      io.to(`conversation:${conversationId}`).emit("message:new", populated);

      for (const participantId of conversation.participants) {
        const pid = participantId.toString();
        if (pid !== userId) {
          io.to(`user:${pid}`).emit("message:notification", {
            conversationId,
            message: populated,
          });
        }
      }
    });

    socket.on("message:read", async ({ conversationId }) => {
      if (!userId || !conversationId) return;
      await Message.updateMany(
        { conversation: conversationId, readBy: { $ne: userId } },
        { $addToSet: { readBy: userId } }
      );
      io.to(`conversation:${conversationId}`).emit("message:read", { conversationId, userId });
    });

    socket.on("disconnect", async () => {
      if (userId) {
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
        io.emit("user:offline", { userId });
      }
    });
  });
};
