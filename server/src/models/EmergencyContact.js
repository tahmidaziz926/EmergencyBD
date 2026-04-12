import mongoose from "mongoose";

const EmergencyContactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    number: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ["police", "fire", "ambulance", "hospital", "other"],
        required: true
    },
    area: {
        type: String,
        required: true,
        trim: true
    },
    notes: {
        type: String,
        default: ""
    }
}, { timestamps: true });

export default mongoose.model("EmergencyContact", EmergencyContactSchema);