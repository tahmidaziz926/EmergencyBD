import FundRequest from "../models/FundRequest.js";
import Donation from "../models/Donation.js";
import MassFundRequest from "../models/MassFundRequest.js";
import MassDonation from "../models/MassDonation.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// ── Notification helper — uses your Notification model's userId field ─────────
const notif = (userId, title, message, type = "fund_update", priority = "medium") => ({
  userId, title, message, type, priority, isRead: false, isArchived: false,
});

// ─────────────────────────────────────────────────────────────────────────────
// FUND REQUEST (system lends — admin approves/rejects)
// ─────────────────────────────────────────────────────────────────────────────

export const submitFundRequest = async (req, res) => {
  try {
    const { title, description, amountNeeded, category } = req.body;
    if (amountNeeded < 1) return res.status(400).json({ message: "Amount must be greater than 0" });

    const newFund = new FundRequest({
      userId: req.user.id, title, description,
      amountNeeded: Number(amountNeeded), category: category || "other"
    });
    await newFund.save();

    const admins = await User.find({ role: "admin" }).select("_id");
    if (admins.length > 0) {
      await Notification.insertMany(admins.map(a =>
        notif(a._id, `💰 New Fund Request: ${title}`,
          `BDT ${Number(amountNeeded).toLocaleString()} requested. ${description.substring(0, 80)}...`)
      ));
    }
    res.status(201).json({ message: "Fund request submitted successfully", fundRequest: newFund });
  } catch (error) {
    console.error("submitFundRequest error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

export const getMyFundRequests = async (req, res) => {
  try {
    const fundRequests = await FundRequest.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(fundRequests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getApprovedFundRequests = async (req, res) => {
  try {
    const fundRequests = await FundRequest.find({ status: "Approved" })
      .populate("userId", "name area").sort({ createdAt: -1 });
    res.status(200).json(fundRequests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const donateFund = async (req, res) => {
  try {
    const { fundRequestId } = req.params;
    const { amount, paymentMethod, note } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ message: "Amount must be at least 1" });

    const fundRequest = await FundRequest.findById(fundRequestId);
    if (!fundRequest) return res.status(404).json({ message: "Fund request not found" });
    if (fundRequest.status !== "Approved") return res.status(400).json({ message: "Can only donate to approved fund requests" });
    if (fundRequest.userId.toString() === req.user.id) return res.status(400).json({ message: "Cannot donate to your own request" });

    const donation = new Donation({
      fundRequestId, donorId: req.user.id,
      amount: Number(amount), paymentMethod, note: note || ""
    });
    await donation.save();
    fundRequest.amountRaised = (fundRequest.amountRaised || 0) + Number(amount);
    fundRequest.donations.push(donation._id);
    await fundRequest.save();

    const donor = await User.findById(req.user.id).select("name");
    await Notification.create(
      notif(fundRequest.userId, `💚 New Donation Received!`,
        `${donor?.name || "Someone"} donated ৳${Number(amount).toLocaleString()} to your fund "${fundRequest.title}".`)
    );
    res.status(201).json({ message: "Donation successful", donation, amountRaised: fundRequest.amountRaised });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getFundRequestById = async (req, res) => {
  try {
    const fundRequest = await FundRequest.findById(req.params.id).populate("userId", "name area");
    if (!fundRequest) return res.status(404).json({ message: "Not found" });
    res.status(200).json(fundRequest);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const deleteMyFundRequest = async (req, res) => {
  try {
    const fund = await FundRequest.findById(req.params.id);
    if (!fund) return res.status(404).json({ message: "Fund request not found" });
    if (fund.userId.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });
    await FundRequest.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Fund request deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// MASS FUND REQUEST (community donations — separate flow)
// ─────────────────────────────────────────────────────────────────────────────

export const submitMassFundRequest = async (req, res) => {
  try {
    const { title, description, goalAmount, contactNumber, area } = req.body;

    // Validate required text fields
    if (!title || !title.trim())          return res.status(400).json({ message: "Title is required." });
    if (!description || !description.trim()) return res.status(400).json({ message: "Description is required." });
    if (!goalAmount || Number(goalAmount) < 1) return res.status(400).json({ message: "A valid goal amount is required." });
    if (Number(goalAmount) > 10000000)    return res.status(400).json({ message: "Goal amount cannot exceed ৳1 Crore." });
    if (!contactNumber || !contactNumber.trim()) return res.status(400).json({ message: "Contact number is required." });

    // ── Extract Cloudinary URLs from uploaded files ──────────────────────────
    // CloudinaryStorage sets file.path = the Cloudinary URL (same as emergency reports)
    const images = [];
    const documents = [];

    if (req.files) {
      if (req.files.images && req.files.images.length > 0) {
        req.files.images.forEach(file => {
          if (file.path) images.push(file.path);
        });
      }
      if (req.files.documents && req.files.documents.length > 0) {
        req.files.documents.forEach(file => {
          if (file.path) documents.push(file.path);
        });
      }
    }

    // Documents are mandatory for admin verification
    if (documents.length === 0) {
      return res.status(400).json({ message: "At least one verification document is required (PDF, DOC, or TXT)." });
    }

    const massFund = new MassFundRequest({
      userId: req.user.id,
      title: title.trim(),
      description: description.trim(),
      goalAmount: Number(goalAmount),
      contactNumber: contactNumber.trim(),
      area: area ? area.trim() : "",
      images,
      documents,
    });
    await massFund.save();

    // Notify admins only (no user-wide notification — users browse manually)
    const admins = await User.find({ role: "admin" }).select("_id");
    if (admins.length > 0) {
      await Notification.insertMany(admins.map(a =>
        notif(a._id,
          `🌍 New Mass Fund Request: ${title}`,
          `Goal: ৳${Number(goalAmount).toLocaleString()} — ${description.substring(0, 80)}...`)
      ));
    }

    res.status(201).json({
      message: "Mass fund request submitted. Awaiting admin approval.",
      massFund
    });
  } catch (error) {
    console.error("submitMassFundRequest error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Users: approved funds — documents are HIDDEN from public
export const getApprovedMassFunds = async (req, res) => {
  try {
    const funds = await MassFundRequest.find({ status: "Approved" })
      .populate("userId", "name area")
      .sort({ createdAt: -1 })
      .select("-documents"); // strip documents
    res.status(200).json(funds);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// User's own requests — full data (they submitted it)
export const getMyMassFunds = async (req, res) => {
  try {
    const funds = await MassFundRequest.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(funds);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Public: single fund — NO documents
export const getMassFundById = async (req, res) => {
  try {
    const fund = await MassFundRequest.findById(req.params.id)
      .populate("userId", "name area")
      .select("-documents");
    if (!fund) return res.status(404).json({ message: "Not found" });
    res.status(200).json(fund);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Admin: single fund — FULL data including documents
export const getMassFundByIdAdmin = async (req, res) => {
  try {
    const fund = await MassFundRequest.findById(req.params.id)
      .populate("userId", "name area email contactInfo");
    if (!fund) return res.status(404).json({ message: "Not found" });
    res.status(200).json(fund);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Admin: all mass fund requests — full data
export const getAllMassFunds = async (req, res) => {
  try {
    const funds = await MassFundRequest.find()
      .populate("userId", "name area email contactInfo")
      .sort({ createdAt: -1 });
    res.status(200).json(funds);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Admin: update status + instant notification to requester
export const updateMassFundStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const fund = await MassFundRequest.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    ).populate("userId", "name area email");
    if (!fund) return res.status(404).json({ message: "Not found" });

    await Notification.create(notif(
      fund.userId._id,
      status === "Approved" ? `✅ Mass Fund Request Approved!` : `❌ Mass Fund Request Rejected`,
      status === "Approved"
        ? `Your mass fund request "${fund.title}" has been approved and is now live for donations.`
        : `Your mass fund request "${fund.title}" was not approved. You may submit a new request.`,
      "fund_update", "high"
    ));

    res.status(200).json({ message: `Status updated to ${status}`, fund });
  } catch (error) {
    console.error("updateMassFundStatus error:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// User or admin: delete a mass fund request
export const deleteMassFund = async (req, res) => {
  try {
    const fund = await MassFundRequest.findById(req.params.id);
    if (!fund) return res.status(404).json({ message: "Not found" });
    const isOwner = fund.userId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Not authorized" });
    await MassFundRequest.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Mass fund request deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// Donate to a mass fund request
export const donateToMassFund = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, note } = req.body;
    if (!amount || amount < 1) return res.status(400).json({ message: "Amount must be at least 1" });

    const fund = await MassFundRequest.findById(id);
    if (!fund) return res.status(404).json({ message: "Mass fund not found" });
    if (fund.status !== "Approved") return res.status(400).json({ message: "Can only donate to approved requests" });
    if (fund.userId.toString() === req.user.id) return res.status(400).json({ message: "Cannot donate to your own request" });

    const donation = new MassDonation({
      massFundRequestId: id, donorId: req.user.id,
      amount: Number(amount), paymentMethod, note: note || ""
    });
    await donation.save();
    fund.amountRaised = (fund.amountRaised || 0) + Number(amount);
    fund.donations.push(donation._id);
    await fund.save();

    const donor = await User.findById(req.user.id).select("name");
    await Notification.create(
      notif(fund.userId,
        `💚 New Donation to Your Campaign!`,
        `${donor?.name || "Someone"} donated ৳${Number(amount).toLocaleString()} to "${fund.title}".`)
    );
    res.status(201).json({ message: "Donation successful", donation, amountRaised: fund.amountRaised });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

export const getMassFundDonations = async (req, res) => {
  try {
    const donations = await MassDonation.find({ massFundRequestId: req.params.id })
      .populate("donorId", "name area")
      .sort({ createdAt: -1 });
    res.status(200).json(donations);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};