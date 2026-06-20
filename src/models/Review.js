import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    review: { type: String, trim: true, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

reviewSchema.index({ sellerId: 1, buyerId: 1, productId: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);
