import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import cloudinary from "../config/cloudinary.js";

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const products = await Product.find({ seller: user._id }).sort({ createdAt: -1 }).limit(12);
    const reviews = await Review.find({ sellerId: user._id })
      .populate("buyerId", "name profileImage")
      .sort({ createdAt: -1 })
      .limit(10);

    return res.json({ success: true, user, products, reviews });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, phone, location } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (location) updates.location = location;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    return res.json({ success: true, user, message: "Profile updated" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfileImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image provided" });

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "neighbormart/profiles" },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      stream.end(req.file.buffer);
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profileImage: result.secure_url },
      { new: true }
    ).select("-password");

    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both passwords required" });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Current password incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (lat == null || lng == null) {
      return res.status(400).json({ success: false, message: "Latitude and longitude required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { location: { lat, lng } },
      { new: true }
    ).select("-password");

    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
