import mongoose from 'mongoose';

const GridProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  productIds: { type: [String], default: [] },
  order: { type: Number, default: 0 },
  visible: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.GridProduct || mongoose.model('GridProduct', GridProductSchema);
