import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  contactInfo: {
    type: String,
    required: true
  },
  area: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: "user"
  },
  notifications: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ["active", "suspended", "blocked"],
    default: "active"
  },
  // F11: geospatial location for radius-based SOS targeting
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [90.4125, 23.8103] // default: Dhaka center
    }
  }
}, { timestamps: true });

// F11: 2dsphere index required for $nearSphere geospatial queries
UserSchema.index({ location: "2dsphere" });

export default mongoose.model("User", UserSchema);