import mongoose from "mongoose";

const SOSEventSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    emergencyType: {
      type: String,
      enum: ["fire", "robbery", "accident", "harassment", "medical", "flood", "other"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        default: "",
      },
    },
    radius: {
      type: Number, // kilometers
      required: true,
      min: 0.5,
      max: 50,
      default: 5,
    },
    status: {
      type: String,
      enum: ["active", "resolved", "expired"],
      default: "active",
    },
    notifiedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Required for $nearSphere geospatial queries
SOSEventSchema.index({ location: "2dsphere" });

export default mongoose.model("SOSEvent", SOSEventSchema);