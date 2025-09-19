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
    const enrollmentId = pathSegments[pathSegments.length - 1];

    switch (method) {
      case 'GET':
        return await handleGetEnrollments(user.id, userData.role, event.queryStringParameters);
      
      case 'POST':
        return await handleCreateEnrollment(user.id, userData.role, JSON.parse(event.body || '{}'));
      
      case 'PUT':
        return await handleUpdateEnrollment(user.id, userData.role, enrollmentId, JSON.parse(event.body || '{}'));
      
      case 'DELETE':
        return await handleDeleteEnrollment(user.id, userData.role, enrollmentId);
      
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

async function handleGetEnrollments(userId, userRole, queryParams) {
  let query = supabaseAdmin
    .from('enrollments')
    .select(`
      *,
      course:courses(*),
      student:users!enrollments_student_id_fkey(id, email, profiles(display_name))
    `);

  // Role-based filtering
  if (userRole === 'student') {
    query = query.eq('student_id', userId);
  } else if (userRole === 'teacher') {
    // Teachers see enrollments for their courses
    const { data: teacherCourses } = await supabaseAdmin
      .from('courses')
      .select('id')
      .eq('teacher_id', userId);
    
    if (teacherCourses && teacherCourses.length > 0) {
      const courseIds = teacherCourses.map(course => course.id);
      query = query.in('course_id', courseIds);
    } else {
      // No courses, return empty result
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify([])
      };
    }
  }
  // Admin and super_admin can see all enrollments

  // Filter by course if specified
  if (queryParams?.course_id) {
    query = query.eq('course_id', queryParams.course_id);
  }

  const { data, error } = await query.order('enrolled_at', { ascending: false });

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

async function handleCreateEnrollment(userId, userRole, enrollmentData) {
  const { course_id } = enrollmentData;

  if (!course_id) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Course ID is required' })
    };
  }

  // Check if course exists and is published
  const { data: course, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', course_id)
    .single();

  if (courseError || !course) {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Course not found' })
    };
  }

  if (course.status !== 'published') {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Course is not available for enrollment' })
    };
  }

  // Create enrollment
  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .insert({
      student_id: userId,
      course_id: course_id,
      progress_percentage: 0
    })
    .select(`
      *,
      course:courses(*)
    `)
    .single();

  if (error) {
    if (error.code === '23505') { // Unique constraint violation
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Already enrolled in this course' })
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

async function handleUpdateEnrollment(userId, userRole, enrollmentId, enrollmentData) {
  if (!enrollmentId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Enrollment ID is required' })
    };
  }

  // Check permissions
  if (!['admin', 'super_admin'].includes(userRole)) {
    // Students can only update their own enrollments
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('student_id')
      .eq('id', enrollmentId)
      .single();

    if (!enrollment || enrollment.student_id !== userId) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Permission denied' })
      };
    }
  }

  // Only allow updating progress and completion status
  const allowedFields = ['progress_percentage', 'completed_at', 'last_accessed_at'];
  const updateData = {};
  
  Object.keys(enrollmentData).forEach(key => {
    if (allowedFields.includes(key)) {
      updateData[key] = enrollmentData[key];
    }
  });

  // Auto-set completion date if progress is 100%
  if (updateData.progress_percentage === 100 && !updateData.completed_at) {
    updateData.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from('enrollments')
    .update(updateData)
    .eq('id', enrollmentId)
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

async function handleDeleteEnrollment(userId, userRole, enrollmentId) {
  if (!enrollmentId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Enrollment ID is required' })
    };
  }

  // Check permissions
  if (!['admin', 'super_admin'].includes(userRole)) {
    // Students can only delete their own enrollments
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('student_id')
      .eq('id', enrollmentId)
      .single();

    if (!enrollment || enrollment.student_id !== userId) {
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Permission denied' })
      };
    }
  }

  const { error } = await supabaseAdmin
    .from('enrollments')
    .delete()
    .eq('id', enrollmentId);

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
    body: JSON.stringify({ message: 'Enrollment deleted successfully' })
  };
}
