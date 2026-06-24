import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";

import connectDB from "./src/config/database.js";
import { broadcastState, getIO } from "./src/services/socketService.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import patientRoutes from "./src/routes/patientRoutes.js";
import sessionRoutes from "./src/routes/sessionRoutes.js";
import queueRoutes from "./src/routes/queueRoutes.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  },
  pingTimeout: 60000,
  transports: ["websocket", "polling"]
});

global.io = io;

io.on("connection", (socket) => {
  console.log(`🟢 Client connected: ${socket.id}`);

  import("./src/services/queueService.js").then(({ default: queueService }) => {
    queueService.getQueueState()
      .then(state => socket.emit("queue:state", state))
      .catch(err => console.error("Failed to send initial state:", err));
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Client disconnected: ${socket.id}`);
  });
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use("/api", limiter);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/patients", patientRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/queue", queueRoutes);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

app.get("/", (req, res) => {
  res.json({
    name: "QueueCure API",
    version: "2.0.0",
    status: "operational",
    endpoints: {
      health: "/health",
      state: "/api/queue/state",
      patients: "/api/patients",
      sessions: "/api/sessions"
    }
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("📡 WebSocket ready");
    });
  })
  .catch(err => {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  });

process.on("SIGTERM", () => {
  console.log("SIGTERM received. Closing server...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});