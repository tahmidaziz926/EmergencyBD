import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["emergency_alert", "fund_update", "status_change", "system"],
    default: "system"
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EmergencyReport",
    default: null
  },
  fundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FundRequest",
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ["high", "medium", "low"],
    default: "medium"
  }
}, { timestamps: true });

export default mongoose.model("Notification", NotificationSchema);