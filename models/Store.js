import mongoose from "mongoose";

const StoreSchema = new mongoose.Schema({
  name: { type: String, required: true },
  userId: { type: String, required: true },
  username: { type: String, required: true, unique: true, lowercase: true },
  description: String,
  email: String,
  contact: String,
  address: String,
  logo: String,
  isActive: { type: Boolean, default: false },
  status: { type: String, default: "pending", enum: ["pending", "approved", "rejected"] },
}, { timestamps: true });

// Create index on username for faster lookups
StoreSchema.index({ username: 1 });
StoreSchema.index({ userId: 1 });

export default mongoose.models.Store || mongoose.model("Store", StoreSchema);
