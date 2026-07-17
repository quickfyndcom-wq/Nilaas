import mongoose from "mongoose";

const RatingSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.Mixed, ref: 'User', required: true },
  orderId: String,
  rating: { type: Number, required: true },
  comment: String,
  review: String,
  images: [String],
  approved: { type: Boolean, default: false },
  isApproved: { type: Boolean, default: false },
  // Add more fields as needed
}, { timestamps: true });

export default mongoose.models.Rating || mongoose.model("Rating", RatingSchema);
