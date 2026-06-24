import queueService from "./queueService.js";

export const broadcastState = async () => {
  if (!global.io) {
    console.warn("Socket.io not initialized");
    return;
  }
  
  try {
    const state = await queueService.getQueueState();
    global.io.emit("queue:state", state);
  } catch (error) {
    console.error("Error broadcasting state:", error);
  }
};

export const getIO = () => {
  if (!global.io) {
    throw new Error("Socket.io not initialized");
  }
  return global.io;
};