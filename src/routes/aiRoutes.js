import express from "express";
import { generateDescription, getPriceSuggestion } from "../controllers/aiController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/description", authMiddleware, generateDescription);
router.post("/price", authMiddleware, getPriceSuggestion);

export default router;
