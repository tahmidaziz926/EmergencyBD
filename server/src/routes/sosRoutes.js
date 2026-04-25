import express from "express";
import SOSEvent from "../models/SOSEvent.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

const typeIcon = {
  fire: "🔥",
  robbery: "🔫",
  accident: "💥",
  harassment: "⚠️",
  medical: "🏥",
  flood: "🌊",
  other: "🚨",
};

// ── POST /api/sos/trigger ─────────────────────────────────────────────────
router.post("/trigger", authMiddleware, async (req, res) => {
  try {
    const { emergencyType, title, description, latitude, longitude, address, radius } = req.body;

    if (!emergencyType || !title || !description || !latitude || !longitude) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const sosEvent = new SOSEvent({
      sender: req.user.id,
      emergencyType,
      title,
      description,
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
        address: address || "",
      },
      radius: parseFloat(radius) || 5,
      status: "active",
    });

    await sosEvent.save();

    // Find users within radius
    let notifiedUserIds = [];
    try {
      const radiusInMeters = sosEvent.radius * 1000;
      const usersInRadius = await User.find({
        _id: { $ne: req.user.id },
        role: { $ne: "admin" },
        location: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: radiusInMeters,
          },
        },
      }).select("_id");
      notifiedUserIds = usersInRadius.map((u) => u._id);
    } catch (geoErr) {
      console.warn("Geo radius query skipped:", geoErr.message);
    }

    // Send in-app notifications to users in radius
    if (notifiedUserIds.length > 0) {
      const notifications = notifiedUserIds.map((userId) => ({
        userId: userId,
        type: "emergency_alert",
        title: `${typeIcon[emergencyType] || "🚨"} SOS Alert: ${title}`,
        message: `An emergency (${emergencyType}) has been reported near your location. Tap to view on map.`,
        priority: "high",
        isRead: false,
      }));
      await Notification.insertMany(notifications);
      sosEvent.notifiedUsers = notifiedUserIds;
      await sosEvent.save();
    }

    // Notify admins
    try {
      const admins = await User.find({ role: "admin" }).select("_id");
      if (admins.length > 0) {
        const adminNotifs = admins.map((admin) => ({
          userId: admin._id,
          type: "emergency_alert",
          title: `${typeIcon[emergencyType] || "🚨"} New SOS: ${title}`,
          message: `${description} — ${address || `${latitude}, ${longitude}`}`,
          priority: "high",
          isRead: false,
        }));
        await Notification.insertMany(adminNotifs);
      }
    } catch (notifErr) {
      console.warn("Admin notification skipped:", notifErr.message);
    }

    res.status(201).json({
      message: "SOS triggered successfully.",
      sosEvent,
      notifiedCount: notifiedUserIds.length,
    });
  } catch (err) {
    console.error("SOS trigger error:", err);
    res.status(500).json({ message: "Server error while triggering SOS." });
  }
});

// ── GET /api/sos/active ───────────────────────────────────────────────────
router.get("/active", authMiddleware, async (req, res) => {
  try {
    const events = await SOSEvent.find({ status: "active" })
      .populate("sender", "name email")
      .sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    console.error("Fetch active SOS error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// ── GET /api/sos/nearby/me ────────────────────────────────────────────────
router.get("/nearby/me", authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 20000 } = req.query;
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location required." });
    }
    const events = await SOSEvent.find({
      status: "active",
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseFloat(maxDistance),
        },
      },
    }).populate("sender", "name");
    res.json(events);
  } catch (err) {
    console.error("Nearby SOS error:", err);
    res.status(500).json({ message: "Server error." });
  }
});

// ── GET /api/sos/:id ──────────────────────────────────────────────────────
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const event = await SOSEvent.findById(req.params.id).populate("sender", "name email");
    if (!event) return res.status(404).json({ message: "SOS event not found." });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── PATCH /api/sos/:id/resolve ────────────────────────────────────────────
router.patch("/:id/resolve", authMiddleware, async (req, res) => {
  try {
    const event = await SOSEvent.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "SOS event not found." });

    const isOwner = event.sender.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Not authorized." });
    }

    event.status = "resolved";
    event.resolvedAt = new Date();
    await event.save();
    res.json({ message: "SOS event resolved.", event });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

// ── PATCH /api/sos/user/location ──────────────────────────────────────────
router.patch("/user/location", authMiddleware, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Latitude and longitude required." });
    }
    await User.findByIdAndUpdate(req.user.id, {
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
    });
    res.json({ message: "Location updated." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
});

export default router;