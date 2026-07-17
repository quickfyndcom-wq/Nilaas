import connectDB from '@/lib/mongoose';
import Blog from '@/models/Blog';

// GET - Fetch all blogs
export async function GET(req) {
  try {
    await connectDB();
    
    const blogs = await Blog.find({})
      .sort({ createdAt: -1 })
      .lean();

    // Convert _id to string for consistency
    const formattedBlogs = blogs.map(blog => ({
      ...blog,
      _id: blog._id.toString()
    }));

    return Response.json({
      success: true,
      blogs: formattedBlogs
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new blog
export async function POST(req) {
  try {
    await connectDB();
    
    const body = await req.json();
    
    const { title, slug, excerpt, content, category, author, image, readTime, published, featuredInSlider, sliderButtonText, sliderButtonLink } = body;

    if (!title || !excerpt || !content) {
      return Response.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const blogData = {
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

    const blog = await Blog.create(blogData);

    return Response.json({
      success: true,
      message: 'Blog created successfully',
      blog: {
        ...blog.toObject(),
        _id: blog._id.toString()
      }
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
