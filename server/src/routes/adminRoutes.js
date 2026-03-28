import express from "express";
import {
  getAllReports,
  getAllFundRequests,
  updateReportStatus,
} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Get all reports
router.get("/reports", authMiddleware, adminMiddleware, getAllReports);

// Get all fund requests
router.get("/fund-requests", authMiddleware, adminMiddleware, getAllFundRequests);

// Update report status
router.put("/reports/:id/status", authMiddleware, adminMiddleware, updateReportStatus);

export default router;