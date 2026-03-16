import express from "express";
import {
  getAllReports,
  getAllFundRequests
} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Protected admin routes
router.get("/reports", authMiddleware, adminMiddleware, getAllReports);
router.get("/fund-requests", authMiddleware, adminMiddleware, getAllFundRequests);

export default router;