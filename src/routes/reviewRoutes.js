import express from "express";
import { createReview, getSellerReviews } from "../controllers/reviewController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createReview);
router.get("/seller/:sellerId", getSellerReviews);

export default router;
