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
    const tagId = pathSegments[pathSegments.length - 1];

    // Public GET endpoint
    if (method === 'GET') {
      return await handleGetTags();
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

    // Only admins can manage tags
    if (!['admin', 'super_admin'].includes(userData.role)) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Permission denied' })
      };
    }

    switch (method) {
      case 'POST':
        return await handleCreateTag(JSON.parse(event.body || '{}'));
      
      case 'PUT':
        return await handleUpdateTag(tagId, JSON.parse(event.body || '{}'));
      
      case 'DELETE':
        return await handleDeleteTag(tagId);
      
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

async function handleGetTags() {
  const { data, error } = await supabaseAdmin
    .from('blog_tags')
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

async function handleCreateTag(tagData) {
  const { name, color } = tagData;

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
    .from('blog_tags')
    .insert({
      name,
      slug,
      color: color || '#10B981'
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Tag with this name already exists' })
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

async function handleUpdateTag(tagId, tagData) {
  if (!tagId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Tag ID is required' })
    };
  }

  const updateData = { ...tagData };
  
  // Update slug if name changed
  if (updateData.name) {
    updateData.slug = updateData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }

  const { data, error } = await supabaseAdmin
    .from('blog_tags')
    .update(updateData)
    .eq('id', tagId)
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

async function handleDeleteTag(tagId) {
  if (!tagId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Tag ID is required' })
    };
  }

  const { error } = await supabaseAdmin
    .from('blog_tags')
    .delete()
    .eq('id', tagId);

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
    body: JSON.stringify({ message: 'Tag deleted successfully' })
  };
}
