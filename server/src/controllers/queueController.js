import queueService from "../services/queueService.js";
import { broadcastState } from "../services/socketService.js";
import Session from "../models/Session.js";

export const getQueueState = async (req, res, next) => {
  try {
    const state = await queueService.getQueueState();
    res.json({
      success: true,
      data: state
    });
  } catch (error) {
    next(error);
  }
};

export const callNext = async (req, res, next) => {
  try {
    const result = await queueService.callNext();
    await broadcastState();
    
    if (result.currentToken === null) {
      return res.json({
        success: true,
        message: "No more patients in queue",
        data: null
      });
    }
    
    res.json({
      success: true,
      message: `Now serving token #${result.currentToken}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const resetQueue = async (req, res, next) => {
  try {
    const session = await queueService.resetQueue();
    await broadcastState();
    
    res.json({
      success: true,
      message: "Queue reset successfully",
      data: session
    });
  } catch (error) {
    next(error);
  }
};

export const getWaitingTime = async (req, res, next) => {
  try {
    const { token } = req.params;
    const session = await Session.getOrCreate();
    
    const waitTime = await queueService.getWaitingTime(
      parseInt(token),
      session.avgConsultTime
    );
    
    res.json({
      success: true,
      data: {
        token: parseInt(token),
        waitTimeMinutes: waitTime
      }
    });
  } catch (error) {
    next(error);
  }
};