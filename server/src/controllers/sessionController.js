import Session from "../models/Session.js";
import { broadcastState } from "../services/socketService.js";
import { validationResult } from "express-validator";
import Patient from "../models/Patient.js";

export const getSession = async (req, res, next) => {
  try {
    const session = await Session.getOrCreate();
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
};

export const updateSession = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }

    const { avgConsultTime } = req.body;
    const session = await Session.getOrCreate();
    
    session.avgConsultTime = avgConsultTime;
    session.updatedAt = new Date();
    await session.save();
    
    await broadcastState();
    
    res.json({
      success: true,
      message: "Session updated successfully",
      data: session
    });
  } catch (error) {
    next(error);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const session = await Session.getOrCreate();
    const totalWaiting = await Patient.countDocuments({ status: "waiting" });
    const totalServing = await Patient.countDocuments({ status: "serving" });
    const totalDone = await Patient.countDocuments({ status: "done" });
    
    res.json({
      success: true,
      data: {
        totalServed: session.totalServed,
        currentToken: session.currentToken,
        avgConsultTime: session.avgConsultTime,
        waitingCount: totalWaiting,
        servingCount: totalServing,
        doneCount: totalDone
      }
    });
  } catch (error) {
    next(error);
  }
};