import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: Date.now },
    unreadCount: { type: Object, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("Conversation", conversationSchema);
