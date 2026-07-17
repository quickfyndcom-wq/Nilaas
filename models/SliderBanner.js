import mongoose from 'mongoose';

const sliderBannerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  buttonText: {
    type: String,
    default: 'Shop Now'
  },
  buttonLink: {
    type: String,
    required: true
  },
  backgroundImage: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.models.SliderBanner || mongoose.model('SliderBanner', sliderBannerSchema);
