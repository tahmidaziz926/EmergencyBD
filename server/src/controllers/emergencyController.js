import EmergencyReport from "../models/EmergencyReport.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// ── CONFIG ────────────────────────────────────────────────────────────────────
const MONTHLY_QUOTA = 15; // change this number to adjust the quota

// ── HELPER: get start and end of current month ────────────────────────────────
const getMonthBounds = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
};

// ── Get quota info for logged-in user ─────────────────────────────────────────
export const getQuotaInfo = async (req, res) => {
  try {
    const { start, end } = getMonthBounds();
    const usedThisMonth = await EmergencyReport.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: start, $lte: end },
    });

    const now = new Date();
    const monthName = now.toLocaleString("en-US", { month: "long" });
    const year = now.getFullYear();

    // Calculate reset date (1st of next month)
    const resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const daysUntilReset = Math.ceil((resetDate - now) / (1000 * 60 * 60 * 24));

    res.status(200).json({
      used: usedThisMonth,
      limit: MONTHLY_QUOTA,
      remaining: Math.max(0, MONTHLY_QUOTA - usedThisMonth),
      exceeded: usedThisMonth >= MONTHLY_QUOTA,
      month: monthName,
      year,
      daysUntilReset,
      resetDate: resetDate.toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ── Submit emergency report (with quota enforcement) ──────────────────────────
export const submitReport = async (req, res) => {
  try {
    const { emergencyType, description, lat, lng, area } = req.body;

    // ── Quota check ──
    const { start, end } = getMonthBounds();
    const usedThisMonth = await EmergencyReport.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: start, $lte: end },
    });

    if (usedThisMonth >= MONTHLY_QUOTA) {
      return res.status(429).json({
        message: `Monthly report limit reached. You have used ${usedThisMonth}/${MONTHLY_QUOTA} reports this month. Your quota resets on the 1st of next month.`,
        quotaExceeded: true,
        used: usedThisMonth,
        limit: MONTHLY_QUOTA,
      });
    }

    const imageUrl = req.file ? req.file.path : null;

    const newReport = new EmergencyReport({
      userId: req.user.id,
      emergencyType,
      description,
      imageUrl,
      location: {
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
        area: area || "",
      },
    });

    await newReport.save();

    // Notify all admins
    const typeEmojis = {
      robbery: "🔫", fire: "🔥", accident: "🚗",
      harassment: "⚠️", medical: "🏥",
    };
    const emoji = typeEmojis[emergencyType] || "🚨";
    const admins = await User.find({ role: "admin" }).select("_id");
    if (admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        userId: admin._id,
        title: `${emoji} New ${emergencyType} Report`,
        message: `A new emergency report has been submitted. Description: ${description.substring(0, 80)}${description.length > 80 ? "..." : ""}`,
        type: "emergency_alert",
        reportId: newReport._id,
        priority: "high",
      }));
      await Notification.insertMany(adminNotifications);
    }

    // Return updated quota info with the response
    const newUsed = usedThisMonth + 1;
    res.status(201).json({
      message: "Emergency report submitted successfully",
      report: newReport,
      quota: {
        used: newUsed,
        limit: MONTHLY_QUOTA,
        remaining: Math.max(0, MONTHLY_QUOTA - newUsed),
        exceeded: newUsed >= MONTHLY_QUOTA,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ── Get logged-in user's reports ──────────────────────────────────────────────
export const getMyReports = async (req, res) => {
  try {
    const reports = await EmergencyReport.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};