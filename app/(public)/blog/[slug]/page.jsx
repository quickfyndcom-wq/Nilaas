'use client'

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';
import { Clock, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BlogPost() {
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const router = useRouter();
  const { slug } = params;

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const response = await axios.get(`/api/blogs/${slug}`);
        if (response.data?.blog) {
          setBlog(response.data.blog);
        }
      } catch (error) {
        console.error('Error fetching blog:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchBlog();
    }
  }, [slug]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1250px' }} className="mx-auto py-12 px-4">
        <div className="text-center py-12">
          <p className="text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div style={{ maxWidth: '1250px' }} className="mx-auto py-12 px-4">
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">Article not found</p>
          <Link href="/blog" className="text-blue-600 hover:text-blue-700">
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1250px' }} className="mx-auto py-12 px-4 text-gray-800">
      {/* Back Button */}
      <Link
        href="/blog"
        className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
      >
        <ArrowLeft size={20} />
        Back to Blog
      </Link>

      {/* Hero Image */}
      {blog.image && (
        <div className="w-full h-96 bg-gray-200 rounded-lg overflow-hidden mb-8">
          <img
            src={blog.image}
            alt={blog.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Article Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          {blog.category && (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
              {blog.category}
            </span>
          )}
        </div>

        <h1 className="text-4xl font-bold mb-4">{blog.title}</h1>

        <div className="flex flex-wrap items-center gap-6 text-gray-600 text-sm">
          {blog.author && (
            <span className="flex items-center gap-2">
              <User size={18} />
              <strong>{blog.author}</strong>
            </span>
          )}
          {blog.createdAt && (
            <span className="flex items-center gap-2">
              <Clock size={18} />
              {new Date(blog.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          )}
          {blog.readTime && (
            <span>{blog.readTime} min read</span>
          )}
        </div>
      </div>

      {/* Excerpt */}
      {blog.excerpt && (
        <p className="text-xl text-gray-600 mb-8 italic leading-relaxed">
          {blog.excerpt}
        </p>
      )}

      {/* Content */}
      <div
        className="prose prose-lg max-w-none mb-12 text-gray-700 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: blog.content }}
      />

      {/* Related Articles (Optional) */}
      <div className="border-t border-gray-200 pt-8">
        <h3 className="text-2xl font-bold mb-6">Read More Articles</h3>
        <Link
          href="/blog"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          View All Articles
        </Link>
      </div>
    </div>
  );
}
