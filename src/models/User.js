import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    profileImage: { type: String, default: "" },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    productsListed: { type: Number, default: 0 },
    productsSold: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export default mongoose.model("User", userSchema);
