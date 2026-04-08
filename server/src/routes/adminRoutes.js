import express from "express";
import {
  getAllReports,
  getAllFundRequests,
  updateReportStatus,
  getFilteredReports,
  updateFundRequestStatus,
} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Get all reports
router.get("/reports", authMiddleware, adminMiddleware, getAllReports);

// Filter reports by type, location, date
// ⚠️ MUST be above /reports/:id/status so Express doesn't treat "filter" as an id
router.get("/reports/filter", authMiddleware, adminMiddleware, getFilteredReports);

// Get all fund requests
router.get("/fund-requests", authMiddleware, adminMiddleware, getAllFundRequests);

// Update fund request status (Approve / Reject)
router.put("/fund-requests/:id/status", authMiddleware, adminMiddleware, updateFundRequestStatus);


// Update report status
router.put("/reports/:id/status", authMiddleware, adminMiddleware, updateReportStatus);

export default router;