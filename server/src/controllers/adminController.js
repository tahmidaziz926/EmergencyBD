import EmergencyReport from "../models/EmergencyReport.js";
import FundRequest from "../models/FundRequest.js";
import User from "../models/User.js";

// Get All Emergency Reports
export const getAllReports = async (req, res) => {
  try {
    const reports = await EmergencyReport.find().populate("userId", "name email area");
    res.status(200).json(reports);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get All Fund Requests
export const getAllFundRequests = async (req, res) => {
  try {
    const fundRequests = await FundRequest.find().populate("userId", "name email area");
    res.status(200).json(fundRequests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};