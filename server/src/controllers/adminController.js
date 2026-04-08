import EmergencyReport from "../models/EmergencyReport.js";
import FundRequest from "../models/FundRequest.js";
import User from "../models/User.js";

// Get all emergency reports
export const getAllReports = async (req, res) => {
  try {
    const reports = await EmergencyReport.find()
      .populate("userId", "name email contactInfo area")
      .sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get all fund requests
export const getAllFundRequests = async (req, res) => {
  try {
    const fundRequests = await FundRequest.find()
      .populate("userId", "name email contactInfo area")
      .sort({ createdAt: -1 });
    res.status(200).json(fundRequests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Update report status
export const updateReportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Pending", "Verified", "Resolved"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const report = await EmergencyReport.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("userId", "name email contactInfo area");

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    res.status(200).json({ message: "Status updated successfully", report });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
// Filter reports by type, location (area), or date
export const getFilteredReports = async (req, res) => {
  try {
    const { emergencyType, area, startDate, endDate } = req.query;

    const filter = {};

    if (emergencyType) {
      filter.emergencyType = emergencyType;
    }

    if (area) {
      filter["location.area"] = { $regex: area, $options: "i" };
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const reports = await EmergencyReport.find(filter)
      .populate("userId", "name email contactInfo area")
      .sort({ createdAt: -1 });

    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};
// Update fund request status (Approve / Reject)
export const updateFundRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Pending", "Approved", "Rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const fundRequest = await FundRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("userId", "name email contactInfo area");

    if (!fundRequest) {
      return res.status(404).json({ message: "Fund request not found" });
    }

    res.status(200).json({ message: "Status updated successfully", fundRequest });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};