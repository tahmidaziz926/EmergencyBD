import BloodRequest from "../models/BloodRequest.js";
import BloodDonor from "../models/BloodDonor.js";
import BloodCampaign from "../models/BloodCampaign.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// ── BLOOD REQUESTS ────────────────────────────────────────────────────────────

// Get all blood requests (everyone can view)
export const getAllBloodRequests = async (req, res) => {
    try {
        const requests = await BloodRequest.find()
            .populate("userId", "name area")
            .sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Get my blood requests
export const getMyBloodRequests = async (req, res) => {
    try {
        const requests = await BloodRequest.find({ userId: req.user.id })
            .sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Create blood request
export const createBloodRequest = async (req, res) => {
    try {
        const { bloodType, liters, hospital, address, reason, contact } = req.body;

        if (!bloodType || !liters || !hospital || !address || !reason || !contact) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const request = new BloodRequest({
            userId: req.user.id,
            bloodType, liters, hospital, address, reason, contact
        });

        await request.save();

        // Notify all users about new blood request
        const allUsers = await User.find({ role: "user" }).select("_id");
        if (allUsers.length > 0) {
            const notifications = allUsers.map(u => ({
                userId: u._id,
                title: `🩸 Blood Needed: ${bloodType}`,
                message: `Urgent blood request at ${hospital}, ${address}. Reason: ${reason.substring(0, 60)}${reason.length > 60 ? "..." : ""}`,
                type: "emergency_alert",
                priority: "high",
            }));
            await Notification.insertMany(notifications);
        }

        res.status(201).json({ message: "Blood request created", request });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Update own blood request
export const updateBloodRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { bloodType, liters, hospital, address, reason, contact, status } = req.body;

        const request = await BloodRequest.findById(id);
        if (!request) return res.status(404).json({ message: "Request not found" });

        // Only owner or admin can update
        if (request.userId.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized" });
        }

        const updated = await BloodRequest.findByIdAndUpdate(
            id,
            { bloodType, liters, hospital, address, reason, contact, status },
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: "Request updated", request: updated });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Delete blood request
export const deleteBloodRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await BloodRequest.findById(id);
        if (!request) return res.status(404).json({ message: "Request not found" });

        if (request.userId.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized" });
        }

        await BloodRequest.findByIdAndDelete(id);
        res.status(200).json({ message: "Request deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// ── BLOOD DONORS ──────────────────────────────────────────────────────────────

// Get all donors
export const getAllDonors = async (req, res) => {
    try {
        const donors = await BloodDonor.find()
            .populate("userId", "name area")
            .sort({ createdAt: -1 });
        res.status(200).json(donors);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Get my donor profile
export const getMyDonorProfile = async (req, res) => {
    try {
        const donor = await BloodDonor.findOne({ userId: req.user.id });
        res.status(200).json(donor);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Register as donor
export const registerDonor = async (req, res) => {
    try {
        const { bloodType, area, contact, lastDonated } = req.body;

        if (!bloodType || !area || !contact) {
            return res.status(400).json({ message: "Blood type, area and contact are required" });
        }

        const existing = await BloodDonor.findOne({ userId: req.user.id });
        if (existing) {
            return res.status(400).json({ message: "You are already registered as a donor" });
        }

        const donor = new BloodDonor({
            userId: req.user.id,
            bloodType, area, contact,
            lastDonated: lastDonated || null
        });

        await donor.save();
        res.status(201).json({ message: "Registered as donor successfully", donor });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Update donor profile — bloodType cannot be changed by user
export const updateDonorProfile = async (req, res) => {
    try {
        const donor = await BloodDonor.findOne({ userId: req.user.id });
        if (!donor) return res.status(404).json({ message: "Donor profile not found" });

        const { area, contact, isAvailable, lastDonated } = req.body;

        // Only admin can change bloodType
        const updateData = { area, contact, isAvailable, lastDonated };
        if (req.user.role === "admin" && req.body.bloodType) {
            updateData.bloodType = req.body.bloodType;
        }

        const updated = await BloodDonor.findByIdAndUpdate(
            donor._id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({ message: "Donor profile updated", donor: updated });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Admin update any donor
export const adminUpdateDonor = async (req, res) => {
    try {
        const { id } = req.params;
        const donor = await BloodDonor.findByIdAndUpdate(
            id,
            req.body,
            { new: true, runValidators: true }
        ).populate("userId", "name area");
        if (!donor) return res.status(404).json({ message: "Donor not found" });
        res.status(200).json({ message: "Donor updated", donor });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Delete donor profile
export const deleteDonorProfile = async (req, res) => {
    try {
        const { id } = req.params;

        let donor;
        if (req.user.role === "admin") {
            donor = await BloodDonor.findByIdAndDelete(id);
        } else {
            donor = await BloodDonor.findOneAndDelete({ userId: req.user.id });
        }

        if (!donor) return res.status(404).json({ message: "Donor profile not found" });
        res.status(200).json({ message: "Donor profile deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// ── BLOOD CAMPAIGNS ───────────────────────────────────────────────────────────

// Get all campaigns (everyone can view)
export const getAllCampaigns = async (req, res) => {
    try {
        const campaigns = await BloodCampaign.find()
            .populate("createdBy", "name")
            .sort({ date: 1 });
        res.status(200).json(campaigns);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Admin: create campaign
export const createCampaign = async (req, res) => {
    try {
        const { title, description, location, date, organizer, contact } = req.body;

        if (!title || !description || !location || !date || !organizer || !contact) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const campaign = new BloodCampaign({
            title, description, location, date, organizer, contact,
            createdBy: req.user.id
        });

        await campaign.save();

        // Notify all registered donors about the campaign
        const donors = await BloodDonor.find().select("userId");
        if (donors.length > 0) {
            const donorNotifications = donors.map(d => ({
                userId: d.userId,
                title: `🩸 Blood Campaign: ${title}`,
                message: `New blood donation campaign at ${location} on ${new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. Organized by ${organizer}.`,
                type: "emergency_alert",
                priority: "medium",
            }));
            await Notification.insertMany(donorNotifications);
        }

        res.status(201).json({ message: "Campaign created", campaign });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Admin: update campaign
export const updateCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const campaign = await BloodCampaign.findByIdAndUpdate(
            id, req.body, { new: true, runValidators: true }
        );
        if (!campaign) return res.status(404).json({ message: "Campaign not found" });
        res.status(200).json({ message: "Campaign updated", campaign });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Admin: delete campaign
export const deleteCampaign = async (req, res) => {
    try {
        const { id } = req.params;
        const campaign = await BloodCampaign.findByIdAndDelete(id);
        if (!campaign) return res.status(404).json({ message: "Campaign not found" });
        res.status(200).json({ message: "Campaign deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};