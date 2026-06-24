import express from "express";
import {
  getQueueState,
  callNext,
  resetQueue,
  getWaitingTime
} from "../controllers/queueController.js";

const router = express.Router();

router.get("/state", getQueueState);
router.post("/next", callNext);
router.delete("/reset", resetQueue);
router.get("/wait-time/:token", getWaitingTime);

export default router;