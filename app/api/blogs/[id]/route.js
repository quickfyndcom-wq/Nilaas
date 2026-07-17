import connectDB from '@/lib/mongoose';
import Blog from '@/models/Blog';
import mongoose from 'mongoose';

// GET - Fetch single blog by ID or slug
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = params;

    let blog;
    if (mongoose.Types.ObjectId.isValid(id)) {
      blog = await Blog.findById(id).lean();
    } else {
      // Try by slug
      blog = await Blog.findOne({ slug: id }).lean();
    }

    if (!blog) {
      return Response.json(
        { success: false, error: 'Blog not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      blog: {
        ...blog,
        _id: blog._id.toString()
      }
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update blog
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = params;
    const body = await req.json();

    const { title, slug, excerpt, content, category, author, image, readTime, published, featuredInSlider, sliderButtonText, sliderButtonLink } = body;

    if (!title || !excerpt || !content) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, error: 'Invalid blog ID' },
        { status: 400 }
      );
    }

    const updateData = {
      title,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      excerpt,
      content,
      category: category || '',
      author: author || '',
      image: image || '',
      readTime: readTime ? parseInt(readTime) : null,
      published: published !== false,
      featuredInSlider: featuredInSlider || false,
      sliderButtonText: sliderButtonText || 'Read More',
      sliderButtonLink: sliderButtonLink || ''
    };

    const blog = await Blog.findByIdAndUpdate(id, updateData, { new: true }).lean();

    if (!blog) {
      return Response.json(
        { success: false, error: 'Blog not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: 'Blog updated successfully',
      blog: {
        ...blog,
        _id: blog._id.toString()
      }
    });
  } catch (error) {
    console.error('Error updating blog:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete blog
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return Response.json(
        { success: false, error: 'Invalid blog ID' },
        { status: 400 }
      );
    }

    const result = await Blog.findByIdAndDelete(id);

    if (!result) {
      return Response.json(
        { success: false, error: 'Blog not found' },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
