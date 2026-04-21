import mongoose from "mongoose";

const MassFundRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  goalAmount: { type: Number, required: true, min: 1 },
  amountRaised: { type: Number, default: 0 },
  contactNumber: { type: String, required: true },
  area: { type: String, required: true },
  // Cloudinary URLs for images/docs
  images: [{ type: String }],
  documents: [{ type: String }],
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending"
  },
  donations: [{ type: mongoose.Schema.Types.ObjectId, ref: "MassDonation" }]
}, { timestamps: true });

export default mongoose.model("MassFundRequest", MassFundRequestSchema);