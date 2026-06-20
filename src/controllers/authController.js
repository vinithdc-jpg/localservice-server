import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  profileImage: user.profileImage,
  location: user.location,
  rating: user.rating,
  ratingCount: user.ratingCount,
  role: user.role,
  productsListed: user.productsListed,
  productsSold: user.productsSold,
  createdAt: user.createdAt,
});

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, profileImage, location } = req.body;

    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: "Name, email, password and phone are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      profileImage: profileImage || "",
      location: { lat: location?.lat ?? null, lng: location?.lng ?? null },
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: formatUser(user),
      token,
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: formatUser(user),
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getCurrentUser = async (req, res) => {
  return res.status(200).json({ success: true, user: formatUser(req.user) });
};
