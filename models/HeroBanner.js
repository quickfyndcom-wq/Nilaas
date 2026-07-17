import mongoose from 'mongoose';

const HeroBannerSchema = new mongoose.Schema({
  image: { type: String, default: '' },
  mobileImage: { type: String, default: '' },
  badge: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  cta: { type: String, default: '' },
  link: { type: String, default: '' },
  showTitle: { type: Boolean, default: true },
  showSubtitle: { type: Boolean, default: true },
  showBadge: { type: Boolean, default: true },
  showButton: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.HeroBanner || mongoose.model('HeroBanner', HeroBannerSchema);
