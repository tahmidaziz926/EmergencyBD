import mongoose from "mongoose";

const emergencyReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emergencyType: {
      type: String,
      enum: ["robbery", "fire", "accident", "harassment", "medical"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
      area: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["Pending", "Verified", "Resolved"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

const EmergencyReport = mongoose.model("EmergencyReport", emergencyReportSchema);
export default EmergencyReport;