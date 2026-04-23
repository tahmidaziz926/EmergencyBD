import express from "express";
import {
    getAllBloodRequests, getMyBloodRequests,
    createBloodRequest, updateBloodRequest, deleteBloodRequest,
    getAllDonors, getMyDonorProfile, registerDonor,
    updateDonorProfile, adminUpdateDonor, deleteDonorProfile,
    getAllCampaigns, createCampaign, updateCampaign, deleteCampaign,
} from "../controllers/bloodController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// ── Blood Requests ────────────────────────────────────────────────────────────
router.get("/requests", authMiddleware, getAllBloodRequests);
router.get("/requests/mine", authMiddleware, getMyBloodRequests);
router.post("/requests", authMiddleware, createBloodRequest);
router.put("/requests/:id", authMiddleware, updateBloodRequest);
router.delete("/requests/:id", authMiddleware, deleteBloodRequest);

// ── Blood Donors ──────────────────────────────────────────────────────────────
router.get("/donors", authMiddleware, getAllDonors);
router.get("/donors/me", authMiddleware, getMyDonorProfile);
router.post("/donors", authMiddleware, registerDonor);
router.put("/donors/me", authMiddleware, updateDonorProfile);
router.put("/donors/:id", authMiddleware, adminMiddleware, adminUpdateDonor);
router.delete("/donors/:id", authMiddleware, adminMiddleware, deleteDonorProfile);
router.delete("/donors/me/profile", authMiddleware, deleteDonorProfile);

// ── Blood Campaigns (admin only write) ───────────────────────────────────────
router.get("/campaigns", authMiddleware, getAllCampaigns);
router.post("/campaigns", authMiddleware, adminMiddleware, createCampaign);
router.put("/campaigns/:id", authMiddleware, adminMiddleware, updateCampaign);
router.delete("/campaigns/:id", authMiddleware, adminMiddleware, deleteCampaign);

export default router;