import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  excerpt: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: ''
  },
  author: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  readTime: {
    type: Number,
    default: null
  },
  published: {
    type: Boolean,
    default: true
  },
  featuredInSlider: {
    type: Boolean,
    default: false
  },
  sliderButtonText: {
    type: String,
    default: 'Read More'
  },
  sliderButtonLink: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);

export default Blog;
