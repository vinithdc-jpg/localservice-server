import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import app from "./app.js";
import connectDB from "./src/config/db.js";
import { setupSocket } from "./src/controllers/chatController.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    console.log("Database connected successfully");

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        credentials: true,
      },
    });

    setupSocket(io);
    app.set("io", io);

    server.listen(PORT, () => {
      console.log(`NeighborMart server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
