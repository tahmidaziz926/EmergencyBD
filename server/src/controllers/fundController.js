import FundRequest from "../models/FundRequest.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// Submit Fund Request
export const submitFundRequest = async (req, res) => {
  try {
    const { title, description, amountNeeded } = req.body;

    if (amountNeeded < 1) {
      return res.status(400).json({ message: "Amount must be greater than 0" });
    }

    const newFundRequest = new FundRequest({
      userId: req.user.id,
      title,
      description,
      amountNeeded
    });

    await newFundRequest.save();

    // Notify all admins about the new fund request
    const admins = await User.find({ role: "admin" }).select("_id");
    if (admins.length > 0) {
      const adminNotifications = admins.map(admin => ({
        userId: admin._id,
        title: `💰 New Fund Request: ${title}`,
        message: `A new fund request of BDT ${amountNeeded.toLocaleString()} has been submitted. ${description.substring(0, 80)}${description.length > 80 ? "..." : ""}`,
        type: "fund_update",
        fundId: newFundRequest._id,
        priority: "medium",
      }));
      await Notification.insertMany(adminNotifications);
    }

    res.status(201).json({ message: "Fund request submitted successfully", fundRequest: newFundRequest });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Get My Fund Requests
export const getMyFundRequests = async (req, res) => {
  try {
    const fundRequests = await FundRequest.find({ userId: req.user.id });
    res.status(200).json(fundRequests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};