import express from "express";
import {
  submitFundRequest,
  getMyFundRequests
} from "../controllers/fundController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected routes
router.post("/request", authMiddleware, submitFundRequest);
router.get("/my-requests", authMiddleware, getMyFundRequests);

export default router;