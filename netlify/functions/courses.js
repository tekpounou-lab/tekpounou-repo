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

    const method = event.httpMethod;
    const pathSegments = event.path.split('/').filter(Boolean);
    const courseId = pathSegments[pathSegments.length - 1];

    switch (method) {
      case 'GET':
        return await handleGetCourses(user.id, userData.role);
      
      case 'POST':
        return await handleCreateCourse(user.id, userData.role, JSON.parse(event.body || '{}'));
      
      case 'PUT':
        return await handleUpdateCourse(user.id, userData.role, courseId, JSON.parse(event.body || '{}'));
      
      case 'DELETE':
        return await handleDeleteCourse(user.id, userData.role, courseId);
      
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

async function handleGetCourses(userId, userRole) {
  let query = supabaseAdmin
    .from('courses')
    .select(`
      *,
      teacher:users!courses_teacher_id_fkey(id, email, profiles(display_name)),
      _count:enrollments(count)
    `);

  // Role-based filtering
  if (userRole === 'teacher') {
    query = query.eq('teacher_id', userId);
  } else if (userRole === 'student') {
    query = query.eq('status', 'published');
  }
  // Admin and super_admin can see all courses

  const { data, error } = await query.order('created_at', { ascending: false });

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

async function handleCreateCourse(userId, userRole, courseData) {
  if (!['teacher', 'admin', 'super_admin'].includes(userRole)) {
    return {
      statusCode: 403,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Permission denied' })
    };
  }

  const { title, description, short_description, difficulty_level, language, is_free } = courseData;

  if (!title || !description) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Title and description are required' })
    };
  }

  const { data, error } = await supabaseAdmin
    .from('courses')
    .insert({
      title,
      description,
      short_description,
      teacher_id: userId,
      difficulty_level: difficulty_level || 'beginner',
      language: language || 'ht',
      is_free: is_free !== undefined ? is_free : true,
      status: 'draft'
    })
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
    statusCode: 201,
    headers: corsHeaders,
    body: JSON.stringify(data)
  };
}

async function handleUpdateCourse(userId, userRole, courseId, courseData) {
  if (!courseId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Course ID is required' })
    };
  }

  // Check permissions
  if (!['admin', 'super_admin'].includes(userRole)) {
    // Teachers can only update their own courses
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('teacher_id')
      .eq('id', courseId)
      .single();

    if (!course || course.teacher_id !== userId) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Permission denied' })
      };
    }
  }

  const { data, error } = await supabaseAdmin
    .from('courses')
    .update({
      ...courseData,
      updated_at: new Date().toISOString()
    })
    .eq('id', courseId)
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

async function handleDeleteCourse(userId, userRole, courseId) {
  if (!courseId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Course ID is required' })
    };
  }

  // Check permissions
  if (!['admin', 'super_admin'].includes(userRole)) {
    // Teachers can only delete their own courses
    const { data: course } = await supabaseAdmin
      .from('courses')
      .select('teacher_id')
      .eq('id', courseId)
      .single();

    if (!course || course.teacher_id !== userId) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Permission denied' })
      };
    }
  }

  const { error } = await supabaseAdmin
    .from('courses')
    .delete()
    .eq('id', courseId);

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
    body: JSON.stringify({ message: 'Course deleted successfully' })
  };
}
