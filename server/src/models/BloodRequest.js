import mongoose from "mongoose";

const BloodRequestSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    bloodType: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        required: true
    },
    liters: {
        type: Number,
        required: true,
        min: 0.1
    },
    hospital: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    contact: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ["open", "fulfilled", "closed"],
        default: "open"
    }
}, { timestamps: true });

export default mongoose.model("BloodRequest", BloodRequestSchema);