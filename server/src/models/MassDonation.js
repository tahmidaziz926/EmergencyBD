import mongoose from "mongoose";

const MassDonationSchema = new mongoose.Schema({
  massFundRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MassFundRequest",
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: { type: Number, required: true, min: 1 },
  paymentMethod: {
    type: String,
    enum: ["bkash", "nagad", "rocket", "upay", "card"],
    required: true
  },
  note: { type: String, default: "" },
  status: {
    type: String,
    enum: ["completed", "pending", "failed"],
    default: "completed"
  }
}, { timestamps: true });

export default mongoose.model("MassDonation", MassDonationSchema);