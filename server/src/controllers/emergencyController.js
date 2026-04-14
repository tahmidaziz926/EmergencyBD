import EmergencyReport from "../models/EmergencyReport.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// Submit emergency report
export const submitReport = async (req, res) => {
  try {
    const { emergencyType, description, lat, lng, area } = req.body;
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

    // Notify all admins about the new report
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

    res.status(201).json({ message: "Emergency report submitted successfully", report: newReport });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get logged-in user's reports
export const getMyReports = async (req, res) => {
  try {
    const reports = await EmergencyReport.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};