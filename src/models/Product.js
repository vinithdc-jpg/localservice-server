import mongoose from "mongoose";

const CATEGORIES = [
  "Electronics",
  "Furniture",
  "Vehicles",
  "Fashion",
  "Books",
  "Sports",
  "Home Appliances",
  "Others",
];

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Used"];

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, enum: CATEGORIES },
    condition: { type: String, required: true, enum: CONDITIONS },
    images: [{ type: String }],
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    status: { type: String, enum: ["available", "sold"], default: "available" },
    views: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
    isNegotiable: { type: Boolean, default: false },
  },
  { timestamps: true }
);

productSchema.index({ title: "text", description: "text", category: "text" });
productSchema.index({ "location.lat": 1, "location.lng": 1 });

export { CATEGORIES, CONDITIONS };
export default mongoose.model("Product", productSchema);
