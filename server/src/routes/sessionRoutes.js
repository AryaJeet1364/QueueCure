import express from "express";
import { body } from "express-validator";
import {
  getSession,
  updateSession,
  getStats
} from "../controllers/sessionController.js";
import { validateRequest } from "../middleware/validation.js";

const router = express.Router();

const sessionValidation = [
  body("avgConsultTime")
    .isInt({ min: 1, max: 120 })
    .withMessage("Avg consultation time must be between 1 and 120 minutes")
];

router.get("/", getSession);
router.put("/", sessionValidation, validateRequest, updateSession);
router.get("/stats", getStats);

export default router;