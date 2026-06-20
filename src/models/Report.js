import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["pending", "resolved", "dismissed"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
