import express from "express";
import {
  getStats,
  getAllUsers,
  deleteUser,
  getAllProducts,
  adminDeleteProduct,
  getReports,
  resolveReport,
} from "../controllers/adminController.js";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/stats", getStats);
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);
router.get("/products", getAllProducts);
router.delete("/products/:id", adminDeleteProduct);
router.get("/reports", getReports);
router.patch("/reports/:id", resolveReport);

export default router;
