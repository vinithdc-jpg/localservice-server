import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./src/routes/authRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import productRoutes from "./src/routes/productRoutes.js";
import wishlistRoutes from "./src/routes/wishlistRoutes.js";
import reviewRoutes from "./src/routes/reviewRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import chatRoutes from "./src/routes/chatRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import aiRoutes from "./src/routes/aiRoutes.js";
import { errorHandler, notFound } from "./src/middleware/errorMiddleware.js";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { success: false, message: "Too many requests" },
  })
);

app.get("/", (req, res) => {
  res.json({ success: true, message: "NeighborMart API is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "healthy" });
});

app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ai", aiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
