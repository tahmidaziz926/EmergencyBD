import mongoose from "mongoose";

const FundRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, required: true },
  amountNeeded: { type: Number, required: true, min: 1 },
  amountRaised: { type: Number, default: 0 },
  category: {
    type: String,
    enum: ["medical", "disaster", "education", "food", "other"],
    default: "other"
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending"
  },
  donations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Donation" }]
}, { timestamps: true });

export default mongoose.model("FundRequest", FundRequestSchema);