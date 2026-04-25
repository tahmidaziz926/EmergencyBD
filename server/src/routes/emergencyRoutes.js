import express from "express";
import {
  submitReport,
  getMyReports,
  getQuotaInfo,
} from "../controllers/emergencyController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.get("/quota", authMiddleware, getQuotaInfo);
router.post("/report", authMiddleware, upload.single("image"), submitReport);
router.get("/my-reports", authMiddleware, getMyReports);

export default router;