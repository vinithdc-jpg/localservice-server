import express from "express";
import {
  getUserProfile,
  updateProfile,
  updateProfileImage,
  changePassword,
  updateLocation,
} from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/:id", getUserProfile);
router.put("/profile", authMiddleware, updateProfile);
router.put("/profile/image", authMiddleware, upload.single("image"), updateProfileImage);
router.put("/profile/password", authMiddleware, changePassword);
router.put("/profile/location", authMiddleware, updateLocation);

export default router;
