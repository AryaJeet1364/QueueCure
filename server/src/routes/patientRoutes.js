import express from "express";
import { body } from "express-validator";
import {
  addPatient,
  getPatients,
  getPatientByToken
} from "../controllers/patientController.js";
import { validateRequest } from "../middleware/validation.js";

const router = express.Router();

// const patientValidation = [
//   body("name")
//     .trim()
//     .notEmpty()
//     .withMessage("Name is required")
//     .isLength({ min: 2, max: 100 })
//     .withMessage("Name must be between 2 and 100 characters"),
//   body("phone")
//     .optional()
//     .trim()
//     .matches(/^[0-9]{10}$/)
//     .withMessage("Phone must be 10 digits")
//     .custom((value) => {
//       // If value is empty, it's valid
//       if (!value) return true;
//       // If value has content, it must be exactly 10 digits
//       if (value.length > 0 && value.length !== 10) {
//         throw new Error("Phone must be exactly 10 digits if provided");
//       }
//       return true;
//     })
// ];

const patientValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters"),
  
  body("phone")
    .optional({ checkFalsy: true }) // This treats "" as "not provided"
    .trim()
    .custom((value) => {
      // If value is empty after trim, it's valid
      if (!value) {
        return true;
      }
      // If value is provided, it must be exactly 10 digits
      if (!/^[0-9]{10}$/.test(value)) {
        throw new Error("Phone must be exactly 10 digits");
      }
      return true;
    })
];

router.post("/", patientValidation, validateRequest, addPatient);
router.get("/", getPatients);
router.get("/:token", getPatientByToken);

export default router;