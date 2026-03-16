import mongoose from "mongoose";

const EmergencyReportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  emergencyType: {
    type: String,
    enum: ["robbery", "fire", "accident", "harassment", "medical"],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ["Pending", "Verified", "Resolved"],
    default: "Pending"
  }
}, { timestamps: true });

export default mongoose.model("EmergencyReport", EmergencyReportSchema);