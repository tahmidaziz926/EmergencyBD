import EmergencyReport from "../models/EmergencyReport.js";

// Submit Emergency Report
export const submitReport = async (req, res) => {
  try {
    const { emergencyType, description } = req.body;

    const newReport = new EmergencyReport({
      userId: req.user.id,
      emergencyType,
      description,
      imageUrl: req.file ? req.file.path : null
    });

    await newReport.save();
    res.status(201).json({ message: "Emergency report submitted successfully", report: newReport });

  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get My Reports
export const getMyReports = async (req, res) => {
  try {
    const reports = await EmergencyReport.find({ userId: req.user.id });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};