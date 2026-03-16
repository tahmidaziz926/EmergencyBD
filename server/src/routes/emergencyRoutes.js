import express from "express";
import {
  submitReport,
  getMyReports
} from "../controllers/emergencyController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Protected routes
router.post("/report", authMiddleware, upload.single("image"), submitReport);
router.get("/my-reports", authMiddleware, getMyReports);

export default router;