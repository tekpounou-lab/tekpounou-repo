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
    const categoryId = pathSegments[pathSegments.length - 1];

    // Public GET endpoint
    if (method === 'GET') {
      return await handleGetCategories();
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

    // Only admins can manage categories
    if (!['admin', 'super_admin'].includes(userData.role)) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Permission denied' })
      };
    }

    switch (method) {
      case 'POST':
        return await handleCreateCategory(JSON.parse(event.body || '{}'));
      
      case 'PUT':
        return await handleUpdateCategory(categoryId, JSON.parse(event.body || '{}'));
      
      case 'DELETE':
        return await handleDeleteCategory(categoryId);
      
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

async function handleGetCategories() {
  const { data, error } = await supabaseAdmin
    .from('blog_categories')
    .select('*')
    .order('name');

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
    body: JSON.stringify(data)
  };
}

async function handleCreateCategory(categoryData) {
  const { name, description, color } = categoryData;

  if (!name) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Name is required' })
    };
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');

  const { data, error } = await supabaseAdmin
    .from('blog_categories')
    .insert({
      name,
      slug,
      description,
      color: color || '#3B82F6'
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Category with this name already exists' })
      };
    }
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }

  return {
    statusCode: 201,
    headers: corsHeaders,
    body: JSON.stringify(data)
  };
}

async function handleUpdateCategory(categoryId, categoryData) {
  if (!categoryId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Category ID is required' })
    };
  }

  const updateData = { ...categoryData };
  
  // Update slug if name changed
  if (updateData.name) {
    updateData.slug = updateData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('blog_categories')
    .update(updateData)
    .eq('id', categoryId)
    .select()
    .single();

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
    body: JSON.stringify(data)
  };
}

async function handleDeleteCategory(categoryId) {
  if (!categoryId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Category ID is required' })
    };
  }

  const { error } = await supabaseAdmin
    .from('blog_categories')
    .delete()
    .eq('id', categoryId);

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
    body: JSON.stringify({ message: 'Category deleted successfully' })
  };
}
