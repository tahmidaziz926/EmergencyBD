import express from "express";
import {
    getAllOpportunities, createOpportunity,
    updateOpportunity, deleteOpportunity,
    markInterested, approveParticipant, revokeApproval,
    getVolunteerList, getUserVolunteerProfile, getLeaderboard,
} from "../controllers/volunteerController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// ── Opportunities ─────────────────────────────────────────────────────────────
router.get("/opportunities", authMiddleware, getAllOpportunities);
router.post("/opportunities", authMiddleware, adminMiddleware, createOpportunity);
router.put("/opportunities/:id", authMiddleware, adminMiddleware, updateOpportunity);
router.delete("/opportunities/:id", authMiddleware, adminMiddleware, deleteOpportunity);

// ── Interest ──────────────────────────────────────────────────────────────────
router.put("/opportunities/:id/interest", authMiddleware, markInterested);

// ── Approve & Points ──────────────────────────────────────────────────────────
router.put("/opportunities/:id/approve/:userId", authMiddleware, adminMiddleware, approveParticipant);
router.put("/opportunities/:id/revoke/:userId", authMiddleware, adminMiddleware, revokeApproval);

// ── Volunteer List & Leaderboard ──────────────────────────────────────────────
router.get("/list", authMiddleware, getVolunteerList);
router.get("/list/:userId", authMiddleware, getUserVolunteerProfile);
router.get("/leaderboard", authMiddleware, getLeaderboard);

export default router;