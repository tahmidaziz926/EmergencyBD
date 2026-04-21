import mongoose from "mongoose";

const DonationSchema = new mongoose.Schema({
  fundRequestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FundRequest",
    required: true
  },
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  paymentMethod: {
    type: String,
    enum: ["bkash", "nagad", "rocket", "upay", "card"],
    required: true
  },
  status: {
    type: String,
    enum: ["completed", "pending", "failed"],
    default: "completed"
  },
  note: {
    type: String,
    default: ""
  }
}, { timestamps: true });

export default mongoose.model("Donation", DonationSchema);