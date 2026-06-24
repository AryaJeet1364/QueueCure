import { validationResult } from "express-validator";
import queueService from "../services/queueService.js";
import { broadcastState } from "../services/socketService.js";
import Patient from "../models/Patient.js";

export const addPatient = async (req, res, next) => {
  try {
    // const errors = validationResult(req);
    // if (!errors.isEmpty()) {
    //   return res.status(400).json({ 
    //     success: false,
    //     errors: errors.array() 
    //   });
    // }

    const { name, phone } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required and must be a string"
      });
    }

    const patientData = {
      name: name.trim(),
      phone: phone ? String(phone).trim() : ""
    };

    console.log("📝 Creating patient with data:", patientData);

    const patient = await queueService.addPatient(patientData);

    console.log("✅ Patient created successfully:", patient);
    
    await broadcastState();
    
    res.status(201).json({
      success: true,
      message: "Patient added successfully",
      data: patient
    });
  } catch (error) {
      console.error("❌ Error in addPatient:", error);
      let errorMessage = error.message || "Failed to add patient";
      if (errorMessage.includes("already in queue")) {
        errorMessage = errorMessage;
      }
      else if (error.name === "ValidationError") {
        errorMessage = Object.values(error.errors).map(e => e.message).join(", ");
      }

      res.status(500).json({
        success: false,
        message: error.message || "Failed to add patient"
      });
  }
};

export const getPatients = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    
    const patients = await Patient.find(query)
      .sort("token")
      .select("-__v");
    
    res.json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    next(error);
  }
};

export const getPatientByToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    const patient = await Patient.findOne({ token })
      .select("-__v");
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found"
      });
    }
    
    res.json({
      success: true,
      data: patient
    });
  } catch (error) {
    next(error);
  }
};