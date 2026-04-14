import express from "express";
import Notification from "../models/Notification.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all notifications (with optional filters)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { type, isRead, isArchived, search, sort } = req.query;

    const filter = { userId: req.user.id };

    if (type && type !== "all") filter.type = type;
    if (isRead !== undefined) filter.isRead = isRead === "true";
    if (isArchived !== undefined) {
      filter.isArchived = isArchived === "true";
    } else {
      filter.isArchived = false;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "priority") sortOption = { priority: 1, createdAt: -1 };
    if (sort === "type") sortOption = { type: 1, createdAt: -1 };

    const notifications = await Notification.find(filter)
      .sort(sortOption)
      .limit(100);

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get unread count per category (for badge)
router.get("/counts", authMiddleware, async (req, res) => {
  try {
    const base = { userId: req.user.id, isRead: false, isArchived: false };
    const [all, emergency_alert, fund_update, status_change, system] = await Promise.all([
      Notification.countDocuments({ userId: req.user.id, isRead: false, isArchived: false }),
      Notification.countDocuments({ ...base, type: "emergency_alert" }),
      Notification.countDocuments({ ...base, type: "fund_update" }),
      Notification.countDocuments({ ...base, type: "status_change" }),
      Notification.countDocuments({ ...base, type: "system" }),
    ]);
    const archived = await Notification.countDocuments({ userId: req.user.id, isArchived: true });
    res.status(200).json({ all, emergency_alert, fund_update, status_change, system, archived });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Mark single as read
router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Mark all as read (optional type filter)
router.put("/mark-all-read", authMiddleware, async (req, res) => {
  try {
    const { type } = req.body;
    const filter = { userId: req.user.id, isRead: false };
    if (type && type !== "all") filter.type = type;
    await Notification.updateMany(filter, { isRead: true });
    res.status(200).json({ message: "All marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Bulk mark as read
router.put("/bulk-read", authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    await Notification.updateMany(
      { _id: { $in: ids }, userId: req.user.id },
      { isRead: true }
    );
    res.status(200).json({ message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Bulk archive
router.put("/bulk-archive", authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    await Notification.updateMany(
      { _id: { $in: ids }, userId: req.user.id },
      { isArchived: true }
    );
    res.status(200).json({ message: "Archived" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Bulk delete
router.delete("/bulk-delete", authMiddleware, async (req, res) => {
  try {
    const { ids } = req.body;
    await Notification.deleteMany({ _id: { $in: ids }, userId: req.user.id });
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Delete single
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

export default router;