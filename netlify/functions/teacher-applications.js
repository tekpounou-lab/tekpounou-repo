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
    const applicationId = pathSegments[pathSegments.length - 1];

    switch (method) {
      case 'GET':
        return await handleGetApplications(user.id, userData.role);
      
      case 'POST':
        return await handleCreateApplication(user.id, userData.role, JSON.parse(event.body || '{}'));
      
      case 'PUT':
        return await handleUpdateApplication(user.id, userData.role, applicationId, JSON.parse(event.body || '{}'));
      
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

async function handleGetApplications(userId, userRole) {
  let query = supabaseAdmin
    .from('teacher_applications')
    .select(`
      *,
      user:users!teacher_applications_user_id_fkey(id, email, profiles(display_name)),
      reviewer:users!teacher_applications_reviewed_by_fkey(id, email, profiles(display_name))
    `);

  // Role-based filtering
  if (userRole === 'student' || userRole === 'teacher') {
    query = query.eq('user_id', userId);
  }
  // Admin and super_admin can see all applications

  const { data, error } = await query.order('applied_at', { ascending: false });

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

async function handleCreateApplication(userId, userRole, applicationData) {
  // Only allow students to apply or admins to create applications on behalf
  if (!['student', 'admin', 'super_admin'].includes(userRole)) {
    return {
      statusCode: 403,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Only students can apply to become teachers' })
    };
  }

  const { motivation, qualifications } = applicationData;

  if (!motivation || !qualifications) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Motivation and qualifications are required' })
    };
  }

  // Check if user already has a pending application
  const { data: existingApplication } = await supabaseAdmin
    .from('teacher_applications')
    .select('id, status')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .single();

  if (existingApplication) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'You already have a pending application' })
    };
  }

  const { data, error } = await supabaseAdmin
    .from('teacher_applications')
    .insert({
      user_id: userId,
      motivation,
      qualifications,
      status: 'pending'
    })
    .select(`
      *,
      user:users!teacher_applications_user_id_fkey(id, email, profiles(display_name))
    `)
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

async function handleUpdateApplication(userId, userRole, applicationId, applicationData) {
  if (!applicationId) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Application ID is required' })
    };
  }

  // Only admins can review applications
  if (!['admin', 'super_admin'].includes(userRole)) {
    return {
      statusCode: 403,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Only admins can review applications' })
    };
  }

  const { status, reviewer_notes } = applicationData;

  if (!status || !['approved', 'rejected'].includes(status)) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Valid status is required (approved/rejected)' })
    };
  }

  // Get the application to update user role if approved
  const { data: application, error: appError } = await supabaseAdmin
    .from('teacher_applications')
    .select('user_id, status')
    .eq('id', applicationId)
    .single();

  if (appError || !application) {
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Application not found' })
    };
  }

  if (application.status !== 'pending') {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Application has already been reviewed' })
    };
  }

  // Start transaction-like operations
  try {
    // Update application status
    const { data, error } = await supabaseAdmin
      .from('teacher_applications')
      .update({
        status,
        reviewer_notes,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', applicationId)
      .select(`
        *,
        user:users!teacher_applications_user_id_fkey(id, email, profiles(display_name)),
        reviewer:users!teacher_applications_reviewed_by_fkey(id, email, profiles(display_name))
      `)
      .single();

    if (error) {
      throw error;
    }

    // If approved, update user role to teacher
    if (status === 'approved') {
      const { error: roleError } = await supabaseAdmin
        .from('users')
        .update({ role: 'teacher' })
        .eq('id', application.user_id);

      if (roleError) {
        // Log error but don't fail the application update
        console.error('Failed to update user role:', roleError);
      }
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: error.message })
    };
  }
}
