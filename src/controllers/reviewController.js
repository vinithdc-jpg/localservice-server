import Review from "../models/Review.js";
import User from "../models/User.js";

export const createReview = async (req, res) => {
  try {
    const { sellerId, productId, rating, review } = req.body;
    if (!sellerId || !rating) {
      return res.status(400).json({ success: false, message: "Seller and rating required" });
    }
    if (sellerId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot review yourself" });
    }

    const existing = await Review.findOne({ sellerId, buyerId: req.user._id, productId });
    if (existing) return res.status(400).json({ success: false, message: "Already reviewed" });

    const newReview = await Review.create({
      sellerId,
      buyerId: req.user._id,
      productId,
      rating: Number(rating),
      review: review || "",
    });

    const reviews = await Review.find({ sellerId });
    const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
    await User.findByIdAndUpdate(sellerId, { rating: Math.round(avgRating * 10) / 10, ratingCount: reviews.length });

    const populated = await Review.findById(newReview._id).populate("buyerId", "name profileImage");
    return res.status(201).json({ success: true, review: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSellerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ sellerId: req.params.sellerId })
      .populate("buyerId", "name profileImage")
      .sort({ createdAt: -1 });
    return res.json({ success: true, reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
