import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";
import { createNotification } from "../utils/notificationHelper.js";

export const getWishlist = async (req, res) => {
  try {
    const items = await Wishlist.find({ userId: req.user._id })
      .populate({
        path: "productId",
        populate: { path: "seller", select: "name profileImage rating" },
      })
      .sort({ createdAt: -1 });

    return res.json({ success: true, wishlist: items });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const existing = await Wishlist.findOne({ userId: req.user._id, productId });
    if (existing) return res.status(400).json({ success: false, message: "Already in wishlist" });

    const item = await Wishlist.create({ userId: req.user._id, productId });
    await Product.findByIdAndUpdate(productId, { $inc: { favorites: 1 } });

    if (product.seller.toString() !== req.user._id.toString()) {
      await createNotification({
        userId: product.seller,
        title: "Wishlist activity",
        message: `Someone saved your listing "${product.title}"`,
        type: "wishlist",
        link: `/product/${productId}`,
      });
    }

    return res.status(201).json({ success: true, item, message: "Added to wishlist" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const productId = req.params.productId;
    const item = await Wishlist.findOneAndDelete({ userId: req.user._id, productId });
    if (!item) return res.status(404).json({ success: false, message: "Not in wishlist" });

    await Product.findByIdAndUpdate(productId, { $inc: { favorites: -1 } });
    return res.json({ success: true, message: "Removed from wishlist" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const checkWishlist = async (req, res) => {
  try {
    const item = await Wishlist.findOne({ userId: req.user._id, productId: req.params.productId });
    return res.json({ success: true, inWishlist: !!item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
