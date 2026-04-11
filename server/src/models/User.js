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
  }
}, { timestamps: true });

export default mongoose.model("User", UserSchema);