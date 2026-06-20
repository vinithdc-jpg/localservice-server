import Product, { CATEGORIES, CONDITIONS } from "../models/Product.js";
import User from "../models/User.js";
import Wishlist from "../models/Wishlist.js";
import Report from "../models/Report.js";
import { haversineDistance } from "../utils/haversine.js";
import cloudinary from "../config/cloudinary.js";
import { createNotification } from "../utils/notificationHelper.js";

const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "neighbormart/products" },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });

export const getCategories = (req, res) => {
  res.json({ success: true, categories: CATEGORIES, conditions: CONDITIONS });
};

export const createProduct = async (req, res) => {
  try {
    const { title, description, price, category, condition, location, isNegotiable } = req.body;
    if (!title || !description || !price || !category || !condition) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const loc = location ? JSON.parse(location) : req.user.location;
    if (!loc?.lat || !loc?.lng) {
      return res.status(400).json({ success: false, message: "Product location required" });
    }

    const images = [];
    if (req.files?.length) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer);
        images.push(result.secure_url);
      }
    }

    const product = await Product.create({
      title,
      description,
      price: Number(price),
      category,
      condition,
      images,
      seller: req.user._id,
      location: loc,
      isNegotiable: isNegotiable === "true" || isNegotiable === true,
    });

    await User.findByIdAndUpdate(req.user._id, { $inc: { productsListed: 1 } });

    const populated = await Product.findById(product._id).populate("seller", "name profileImage rating");
    return res.status(201).json({ success: true, product: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const {
      search,
      category,
      condition,
      minPrice,
      maxPrice,
      sort = "newest",
      lat,
      lng,
      radius = 20,
      page = 1,
      limit = 12,
      status = "available",
    } = req.query;

    const query = { status };
    if (category) query.category = category;
    if (condition) query.condition = condition;
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (search) query.$text = { $search: search };

    let products = await Product.find(query)
      .populate("seller", "name profileImage rating")
      .lean();

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    if (!isNaN(userLat) && !isNaN(userLng)) {
      products = products
        .map((p) => ({
          ...p,
          distance: Math.round(haversineDistance(userLat, userLng, p.location.lat, p.location.lng) * 10) / 10,
        }))
        .filter((p) => p.distance <= radiusKm);
    }

    switch (sort) {
      case "nearest":
        if (!isNaN(userLat)) products.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
        break;
      case "price-low":
        products.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        products.sort((a, b) => b.price - a.price);
        break;
      default:
        products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const total = products.length;
    const start = (Number(page) - 1) * Number(limit);
    const paginated = products.slice(start, start + Number(limit));

    return res.json({ success: true, products: paginated, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate("seller", "name profileImage rating phone createdAt productsSold productsListed");

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    let distance = null;
    const { lat, lng } = req.query;
    if (lat && lng) {
      distance = Math.round(
        haversineDistance(parseFloat(lat), parseFloat(lng), product.location.lat, product.location.lng) * 10
      ) / 10;
    }

    return res.json({ success: true, product: { ...product.toObject(), distance } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const { title, description, price, category, condition, isNegotiable, location } = req.body;
    if (title) product.title = title;
    if (description) product.description = description;
    if (price) product.price = Number(price);
    if (category) product.category = category;
    if (condition) product.condition = condition;
    if (isNegotiable !== undefined) product.isNegotiable = isNegotiable === "true" || isNegotiable === true;
    if (location) product.location = JSON.parse(location);

    if (req.files?.length) {
      for (const file of req.files) {
        const result = await uploadToCloudinary(file.buffer);
        product.images.push(result.secure_url);
      }
    }

    await product.save();
    const populated = await Product.findById(product._id).populate("seller", "name profileImage rating");
    return res.json({ success: true, product: populated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (product.seller.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await Product.findByIdAndDelete(req.params.id);
    await Wishlist.deleteMany({ productId: req.params.id });
    return res.json({ success: true, message: "Product deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsSold = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    product.status = "sold";
    await product.save();
    await User.findByIdAndUpdate(req.user._id, { $inc: { productsSold: 1 } });

    const wishlistUsers = await Wishlist.find({ productId: product._id });
    for (const w of wishlistUsers) {
      await createNotification({
        userId: w.userId,
        title: "Wishlist item sold",
        message: `"${product.title}" has been marked as sold`,
        type: "product_sold",
        link: `/product/${product._id}`,
      });
    }

    return res.json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });
    const stats = {
      totalListings: products.length,
      totalViews: products.reduce((s, p) => s + p.views, 0),
      totalFavorites: products.reduce((s, p) => s + p.favorites, 0),
      soldProducts: products.filter((p) => p.status === "sold").length,
    };
    return res.json({ success: true, products, stats });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const reportProduct = async (req, res) => {
  try {
    const { reason, description } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: "Reason required" });

    const report = await Report.create({
      product: req.params.id,
      reporter: req.user._id,
      reason,
      description: description || "",
    });

    return res.status(201).json({ success: true, report, message: "Report submitted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
