import { supabaseAdmin } from '../../lib/supabase-admin.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
};

exports.handler = async (event) => {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders };
  }

  try {
    const method = event.httpMethod;
    const pathSegments = event.path.split('/').filter(Boolean);
    const postId = pathSegments[pathSegments.length - 1];
    const queryParams = event.queryStringParameters || {};

    // Public endpoints (no auth required)
    if (method === 'GET' && !postId) {
      return await handleGetBlogPosts(queryParams);
    }
    
    if (method === 'GET' && postId && postId !== 'blog') {
      return await handleGetBlogPost(postId);
    }

    // Protected endpoints (auth required)
    const token = event.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'No authorization token provided' })
      };
    }

    // Verify user authentication
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid token' })
      };
    }

    // Get user role
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    switch (method) {
      case 'POST':
        return await handleCreateBlogPost(user.id, userData.role, JSON.parse(event.body || '{}'));
      
      case 'PUT':
        return await handleUpdateBlogPost(user.id, userData.role, postId, JSON.parse(event.body || '{}'));
      
      case 'DELETE':
        return await handleDeleteBlogPost(user.id, userData.role, postId);
      
      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function handleGetBlogPosts(queryParams) {
  let query = supabaseAdmin
    .from('blog_posts')
    .select(`
      *,
      author:users!blog_posts_author_id_fkey(id, email, profiles(display_name, avatar)),
      category:blog_categories(id, name, slug, color),
      tags:blog_post_tags(tag:blog_tags(id, name, slug, color))
    `)
    .eq('status', 'published');

  // Apply filters
  if (queryParams.category) {
    query = query.eq('category.slug', queryParams.category);
  }

  if (queryParams.language) {
    query = query.eq('language', queryParams.language);
  }

  if (queryParams.featured === 'true') {
    query = query.eq('is_featured', true);
  }

  // Pagination
  const page = parseInt(queryParams.page || '1');
  const limit = parseInt(queryParams.limit || '10');
  const offset = (page - 1) * limit;

  query = query
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  };
}

async function handleGetBlogPost(postIdOrSlug) {
  let query = supabaseAdmin
    .from('blog_posts')
    .select(`
      *,
      author:users!blog_posts_author_id_fkey(id, email, profiles(display_name, avatar, bio)),
      category:blog_categories(id, name, slug, color),
      tags:blog_post_tags(tag:blog_tags(id, name, slug, color))
    `);

  // Check if it's UUID or slug
  if (postIdOrSlug.includes('-')) {
    query = query.eq('slug', postIdOrSlug);
  } else {
    query = query.eq('id', postIdOrSlug);
  }

  const { data, error } = await query.single();

  if (error) {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Blog post not found' })
    };
  }

  // Increment view count
  await supabaseAdmin.rpc('increment_blog_post_views', { post_id: data.id });

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify(data)
  };
}

async function handleCreateBlogPost(userId, userRole, postData) {
  if (!['admin', 'super_admin', 'teacher'].includes(userRole)) {
    return {
      statusCode: 403,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Permission denied' })
    };
  }

  const { title, content, excerpt, category_id, tag_ids, language, is_featured } = postData;

  if (!title || !content) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Title and content are required' })
    };
  }

  // Generate slug from title
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');

  try {
    // Create blog post
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .insert({
        title,
        slug,
        content,
        excerpt,
        author_id: userId,
        category_id,
        language: language || 'ht',
        is_featured: is_featured || false,
        status: 'draft'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Add tags if provided
    if (tag_ids && tag_ids.length > 0) {
      const tagInserts = tag_ids.map(tag_id => ({
        blog_post_id: data.id,
        tag_id
      }));

      await supabaseAdmin
        .from('blog_post_tags')
        .insert(tagInserts);
    }

    // Fetch complete post data
    const { data: completePost } = await supabaseAdmin
      .from('blog_posts')
      .select(`
        *,
        author:users!blog_posts_author_id_fkey(id, email, profiles(display_name, avatar)),
        category:blog_categories(id, name, slug, color),
        tags:blog_post_tags(tag:blog_tags(id, name, slug, color))
      `)
      .eq('id', data.id)
      .single();

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify(completePost)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }
}

async function handleUpdateBlogPost(userId, userRole, postId, postData) {
  if (!postId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Post ID is required' })
    };
  }

  // Check permissions
  if (!['admin', 'super_admin'].includes(userRole)) {
    // Authors can only update their own posts
    const { data: post } = await supabaseAdmin
      .from('blog_posts')
      .select('author_id')
      .eq('id', postId)
      .single();

    if (!post || post.author_id !== userId) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Permission denied' })
      };
    }
  }

  const { tag_ids, ...updateData } = postData;

  // Update slug if title changed
  if (updateData.title) {
    updateData.slug = updateData.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  try {
    // Update blog post
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update tags if provided
    if (tag_ids !== undefined) {
      // Remove existing tags
      await supabaseAdmin
        .from('blog_post_tags')
        .delete()
        .eq('blog_post_id', postId);

      // Add new tags
      if (tag_ids.length > 0) {
        const tagInserts = tag_ids.map(tag_id => ({
          blog_post_id: postId,
          tag_id
        }));

        await supabaseAdmin
          .from('blog_post_tags')
          .insert(tagInserts);
      }
    }

    // Fetch complete post data
    const { data: completePost } = await supabaseAdmin
      .from('blog_posts')
      .select(`
        *,
        author:users!blog_posts_author_id_fkey(id, email, profiles(display_name, avatar)),
        category:blog_categories(id, name, slug, color),
        tags:blog_post_tags(tag:blog_tags(id, name, slug, color))
      `)
      .eq('id', postId)
      .single();

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(completePost)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }
}

async function handleDeleteBlogPost(userId, userRole, postId) {
  if (!postId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Post ID is required' })
    };
  }

  // Check permissions
  if (!['admin', 'super_admin'].includes(userRole)) {
    // Authors can only delete their own posts
    const { data: post } = await supabaseAdmin
      .from('blog_posts')
      .select('author_id')
      .eq('id', postId)
      .single();

    if (!post || post.author_id !== userId) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Permission denied' })
      };
    }
  }

  const { error } = await supabaseAdmin
    .from('blog_posts')
    .delete()
    .eq('id', postId);

  if (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }

  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({ message: 'Blog post deleted successfully' })
  };
}
