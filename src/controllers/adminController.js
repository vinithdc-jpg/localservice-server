import User from "../models/User.js";
import Product from "../models/Product.js";
import Report from "../models/Report.js";
import Review from "../models/Review.js";
import Wishlist from "../models/Wishlist.js";

export const getStats = async (req, res) => {
  try {
    const [totalUsers, totalProducts, activeListings, soldProducts, pendingReports] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Product.countDocuments({ status: "available" }),
      Product.countDocuments({ status: "sold" }),
      Report.countDocuments({ status: "pending" }),
    ]);

    return res.json({
      success: true,
      stats: { totalUsers, totalProducts, activeListings, totalSales: soldProducts, pendingReports },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    return res.json({ success: true, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot delete yourself" });
    }
    await User.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("seller", "name email")
      .sort({ createdAt: -1 });
    return res.json({ success: true, products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const adminDeleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    await Wishlist.deleteMany({ productId: req.params.id });
    return res.json({ success: true, message: "Product removed" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("product", "title images")
      .populate("reporter", "name email")
      .sort({ createdAt: -1 });
    return res.json({ success: true, reports });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const resolveReport = async (req, res) => {
  try {
    const { status, removeProduct } = req.body;
    const report = await Report.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (removeProduct && status === "resolved") {
      await Product.findByIdAndDelete(report.product);
    }

    return res.json({ success: true, report });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
