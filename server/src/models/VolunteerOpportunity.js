import mongoose from "mongoose";

const VolunteerOpportunitySchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    organization: { type: String, required: true, trim: true },
    place: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    time: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    interestedUsers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    approvedUsers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ]
}, { timestamps: true });

export default mongoose.model("VolunteerOpportunity", VolunteerOpportunitySchema);