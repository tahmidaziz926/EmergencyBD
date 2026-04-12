import express from "express";
import {
  getAllReports,
  getAllFundRequests,
  updateReportStatus,
  getFilteredReports,
  updateFundRequestStatus,
  getAllUsers,
  updateUserStatus,
  getAllContacts,
  addContact,
  updateContact,
  deleteContact,
} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// ── Reports ──────────────────────────────────────────
router.get("/reports", authMiddleware, adminMiddleware, getAllReports);
router.get("/reports/filter", authMiddleware, adminMiddleware, getFilteredReports);
router.put("/reports/:id/status", authMiddleware, adminMiddleware, updateReportStatus);

// ── Fund Requests ─────────────────────────────────────
router.get("/fund-requests", authMiddleware, adminMiddleware, getAllFundRequests);
router.put("/fund-requests/:id/status", authMiddleware, adminMiddleware, updateFundRequestStatus);

// ── Users ─────────────────────────────────────────────
router.get("/users", authMiddleware, adminMiddleware, getAllUsers);
router.put("/users/:id/status", authMiddleware, adminMiddleware, updateUserStatus);

// ── Emergency Contacts ────────────────────────────────
// Public read (any logged-in user) — no adminMiddleware
router.get("/contacts", authMiddleware, getAllContacts);

// Admin-only write operations
router.post("/contacts", authMiddleware, adminMiddleware, addContact);
router.put("/contacts/:id", authMiddleware, adminMiddleware, updateContact);
router.delete("/contacts/:id", authMiddleware, adminMiddleware, deleteContact);

export default router;