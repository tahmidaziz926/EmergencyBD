import mongoose from "mongoose";

const BloodDonorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true  // one donor profile per user
    },
    bloodType: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
        required: true
    },
    area: {
        type: String,
        required: true,
        trim: true
    },
    contact: {
        type: String,
        required: true,
        trim: true
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    lastDonated: {
        type: Date,
        default: null
    }
}, { timestamps: true });

export default mongoose.model("BloodDonor", BloodDonorSchema);