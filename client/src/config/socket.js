import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.PROD
    ? "https://queue-cure-backend.onrender.com"
    : "http://localhost:4000");

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  timeout: 20000
});

socket.on("connect", () => {
  console.log(`✅ Socket connected: ${socket.id}`);
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket connection error:", error.message);
});

socket.on("disconnect", (reason) => {
  console.log(`🔴 Socket disconnected: ${reason}`);
});

socket.on("reconnect", (attempt) => {
  console.log(`🔄 Socket reconnected after ${attempt} attempts`);
});

export default socket;