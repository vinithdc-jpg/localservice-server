import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  markAsSold,
  getMyProducts,
  reportProduct,
  getCategories,
} from "../controllers/productController.js";
import { authMiddleware, optionalAuth } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/meta/categories", getCategories);
router.get("/", optionalAuth, getProducts);
router.get("/my/listings", authMiddleware, getMyProducts);
router.get("/:id", optionalAuth, getProductById);
router.post("/", authMiddleware, upload.array("images", 5), createProduct);
router.put("/:id", authMiddleware, upload.array("images", 5), updateProduct);
router.delete("/:id", authMiddleware, deleteProduct);
router.patch("/:id/sold", authMiddleware, markAsSold);
router.post("/:id/report", authMiddleware, reportProduct);

export default router;
