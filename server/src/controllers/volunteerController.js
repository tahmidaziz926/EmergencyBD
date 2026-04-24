import VolunteerOpportunity from "../models/VolunteerOpportunity.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// ── OPPORTUNITIES ─────────────────────────────────────────────────────────────

export const getAllOpportunities = async (req, res) => {
    try {
        const opportunities = await VolunteerOpportunity.find()
            .populate("createdBy", "name")
            .populate("interestedUsers", "name area")
            .populate("approvedUsers", "name area")
            .sort({ date: 1 });
        res.status(200).json(opportunities);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const createOpportunity = async (req, res) => {
    try {
        const { title, organization, place, date, time, reason } = req.body;
        if (!title || !organization || !place || !date || !time || !reason) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const opportunity = new VolunteerOpportunity({
            title, organization, place, date, time, reason,
            createdBy: req.user.id
        });
        await opportunity.save();

        const allUsers = await User.find({ role: "user" }).select("_id");
        if (allUsers.length > 0) {
            const notifications = allUsers.map(u => ({
                userId: u._id,
                title: `🤝 New Volunteer Opportunity: ${title}`,
                message: `${organization} is looking for volunteers at ${place} on ${new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}. Reason: ${reason.substring(0, 60)}${reason.length > 60 ? "..." : ""}`,
                type: "system",
                priority: "medium",
            }));
            await Notification.insertMany(notifications);
        }
        res.status(201).json({ message: "Opportunity created", opportunity });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const updateOpportunity = async (req, res) => {
    try {
        const { id } = req.params;
        const opportunity = await VolunteerOpportunity.findByIdAndUpdate(
            id, req.body, { new: true, runValidators: true }
        );
        if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });
        res.status(200).json({ message: "Opportunity updated", opportunity });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const deleteOpportunity = async (req, res) => {
    try {
        const { id } = req.params;
        const opportunity = await VolunteerOpportunity.findByIdAndDelete(id);
        if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });
        res.status(200).json({ message: "Opportunity deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// ── INTEREST ──────────────────────────────────────────────────────────────────

export const markInterested = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const opportunity = await VolunteerOpportunity.findById(id);
        if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });

        const alreadyInterested = opportunity.interestedUsers
            .some(u => u.toString() === userId);

        if (alreadyInterested) {
            opportunity.interestedUsers = opportunity.interestedUsers
                .filter(u => u.toString() !== userId);
            await opportunity.save();
            return res.status(200).json({ message: "Interest removed", interested: false });
        }

        opportunity.interestedUsers.push(userId);
        await opportunity.save();
        res.status(200).json({ message: "Marked as interested", interested: true });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// ── APPROVE & POINTS ──────────────────────────────────────────────────────────

export const approveParticipant = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const opportunity = await VolunteerOpportunity.findById(id);
        if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });

        const alreadyApproved = opportunity.approvedUsers
            .some(u => u.toString() === userId);
        if (alreadyApproved) {
            return res.status(400).json({ message: "User already approved" });
        }

        opportunity.approvedUsers.push(userId);
        await opportunity.save();

        await User.findByIdAndUpdate(userId, {
            $inc: { points: 1 },
            $push: {
                volunteerHistory: {
                    opportunityId: opportunity._id,
                    opportunityTitle: opportunity.title,
                    organization: opportunity.organization,
                    date: opportunity.date,
                    pointsEarned: 1,
                    approvedAt: new Date(),
                }
            }
        });

        await Notification.create({
            userId,
            title: "🤝 Volunteer Participation Approved!",
            message: `Your participation in "${opportunity.title}" by ${opportunity.organization} has been approved. You earned 1 point!`,
            type: "system",
            priority: "high",
        });

        res.status(200).json({ message: "Participant approved and 1 point awarded" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const revokeApproval = async (req, res) => {
    try {
        const { id, userId } = req.params;
        const opportunity = await VolunteerOpportunity.findById(id);
        if (!opportunity) return res.status(404).json({ message: "Opportunity not found" });

        opportunity.approvedUsers = opportunity.approvedUsers
            .filter(u => u.toString() !== userId);
        await opportunity.save();

        const user = await User.findById(userId);
        if (user && user.points > 0) {
            await User.findByIdAndUpdate(userId, {
                $inc: { points: -1 },
                $pull: { volunteerHistory: { opportunityId: opportunity._id } }
            });
        }

        res.status(200).json({ message: "Approval revoked and point removed" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// ── VOLUNTEER LIST & LEADERBOARD ──────────────────────────────────────────────

// FIX: Only return users who have been approved at least once (points > 0 OR history > 0)
export const getVolunteerList = async (req, res) => {
    try {
        const users = await User.find({
            role: "user",
            $or: [
                { points: { $gt: 0 } },
                { "volunteerHistory.0": { $exists: true } }
            ]
        })
            .select("name area points volunteerHistory")
            .sort({ points: -1, "volunteerHistory.length": -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

export const getUserVolunteerProfile = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId)
            .select("name area points volunteerHistory");
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// FIX: Leaderboard uses same list endpoint logic — top 3 with points > 0
export const getLeaderboard = async (req, res) => {
    try {
        const top = await User.find({ role: "user", points: { $gt: 0 } })
            .select("name area points volunteerHistory")
            .sort({ points: -1 })
            .limit(3);
        res.status(200).json(top);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};