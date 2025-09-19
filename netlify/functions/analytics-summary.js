const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { user } = await supabase.auth.getUser(
      event.headers.authorization?.replace('Bearer ', '')
    );

    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authentication required' })
      };
    }

    if (event.httpMethod === 'GET') {
      const queryParams = event.queryStringParameters || {};
      const { scope, ref_id, period = 'all_time' } = queryParams;

      // Get user profile to check role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ error: 'Access denied' })
        };
      }

      // Generate analytics summary based on scope
      if (scope === 'dashboard') {
        const dashboardData = await generateDashboardSummary(user.id, profile.role);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(dashboardData)
        };
      }

      // Fetch existing analytics summary
      let query = supabase
        .from('analytics_summary')
        .select('*')
        .eq('period', period);

      if (scope) {
        query = query.eq('scope', scope);
      }

      if (ref_id) {
        query = query.eq('ref_id', ref_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Analytics summary fetch error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch analytics summary' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    if (event.httpMethod === 'POST') {
      // Generate/update analytics summary
      const { scope, ref_id, period = 'all_time' } = JSON.parse(event.body);

      if (!scope) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Scope is required' })
        };
      }

      const metrics = await generateMetrics(scope, ref_id, period);

      const { data, error } = await supabase
        .from('analytics_summary')
        .upsert({
          scope,
          ref_id,
          period,
          metrics,
          calculated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Analytics summary update error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to update analytics summary' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data[0])
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Analytics summary function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function generateDashboardSummary(userId, userRole) {
  const summary = {
    overview: {},
    charts: {},
    recent_activity: []
  };

  try {
    if (userRole === 'super_admin') {
      // Global overview for super admin
      summary.overview = await getGlobalOverview();
      summary.charts = await getGlobalCharts();
    } else if (userRole === 'admin') {
      // Content and project metrics for admin
      summary.overview = await getAdminOverview();
      summary.charts = await getAdminCharts();
    } else if (userRole === 'teacher') {
      // Teacher's courses analytics
      summary.overview = await getTeacherOverview(userId);
      summary.charts = await getTeacherCharts(userId);
    } else if (userRole === 'sme_client') {
      // SME client's projects analytics
      summary.overview = await getSMEOverview(userId);
      summary.charts = await getSMECharts(userId);
    } else {
      // Student's personal progress
      summary.overview = await getStudentOverview(userId);
      summary.charts = await getStudentCharts(userId);
    }

    // Get recent activity for all users
    summary.recent_activity = await getRecentActivity(userId, userRole);

  } catch (error) {
    console.error('Dashboard summary generation error:', error);
  }

  return summary;
}

async function getGlobalOverview() {
  const [usersCount, coursesCount, servicesCount, blogPostsCount] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact' }),
    supabase.from('courses').select('id', { count: 'exact' }),
    supabase.from('services').select('id', { count: 'exact' }),
    supabase.from('blog_posts').select('id', { count: 'exact' })
  ]);

  return {
    total_users: usersCount.count || 0,
    total_courses: coursesCount.count || 0,
    total_services: servicesCount.count || 0,
    total_blog_posts: blogPostsCount.count || 0
  };
}

async function getGlobalCharts() {
  // Get user registration trends (last 30 days)
  const { data: userTrends } = await supabase.rpc('get_user_registration_trends');
  
  // Get course enrollment trends
  const { data: enrollmentTrends } = await supabase.rpc('get_enrollment_trends');

  return {
    user_trends: userTrends || [],
    enrollment_trends: enrollmentTrends || []
  };
}

async function getTeacherOverview(userId) {
  const [coursesCount, enrollmentsCount] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact' }).eq('instructor_id', userId),
    supabase.from('enrollments')
      .select('id', { count: 'exact' })
      .in('course_id', 
        (await supabase.from('courses').select('id').eq('instructor_id', userId)).data?.map(c => c.id) || []
      )
  ]);

  return {
    my_courses: coursesCount.count || 0,
    total_enrollments: enrollmentsCount.count || 0
  };
}

async function getStudentOverview(userId) {
  const [enrollmentsCount, completedCount] = await Promise.all([
    supabase.from('enrollments').select('id', { count: 'exact' }).eq('user_id', userId),
    supabase.from('enrollments')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('progress_percentage', 100)
  ]);

  return {
    enrolled_courses: enrollmentsCount.count || 0,
    completed_courses: completedCount.count || 0,
    completion_rate: enrollmentsCount.count ? 
      ((completedCount.count / enrollmentsCount.count) * 100).toFixed(1) : 0
  };
}

async function getSMEOverview(userId) {
  const [requestsCount, projectsCount] = await Promise.all([
    supabase.from('service_requests').select('id', { count: 'exact' }).eq('client_id', userId),
    supabase.from('projects').select('id', { count: 'exact' }).eq('client_id', userId)
  ]);

  return {
    service_requests: requestsCount.count || 0,
    active_projects: projectsCount.count || 0
  };
}

async function getAdminOverview() {
  const [requestsCount, projectsCount, activeUsersCount] = await Promise.all([
    supabase.from('service_requests').select('id', { count: 'exact' }),
    supabase.from('projects').select('id', { count: 'exact' }),
    supabase.from('analytics_events')
      .select('user_id', { count: 'exact' })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
  ]);

  return {
    total_service_requests: requestsCount.count || 0,
    total_projects: projectsCount.count || 0,
    active_users_30d: activeUsersCount.count || 0
  };
}

async function getRecentActivity(userId, userRole) {
  let query = supabase
    .from('analytics_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);

  if (userRole !== 'super_admin' && userRole !== 'admin') {
    query = query.eq('user_id', userId);
  }

  const { data } = await query;
  return data || [];
}

async function getTeacherCharts(userId) {
  // Get enrollment trends for teacher's courses
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .eq('instructor_id', userId);

  const courseIds = courses?.map(c => c.id) || [];

  if (courseIds.length === 0) {
    return { enrollment_trends: [], completion_rates: [] };
  }

  const { data: enrollmentData } = await supabase
    .from('enrollments')
    .select('course_id, created_at, progress_percentage')
    .in('course_id', courseIds);

  return {
    enrollment_trends: enrollmentData || [],
    completion_rates: courses.map(course => ({
      course_name: course.title,
      completion_rate: calculateCompletionRate(enrollmentData, course.id)
    }))
  };
}

async function getStudentCharts(userId) {
  const { data: progress } = await supabase
    .from('enrollments')
    .select('*, courses(title)')
    .eq('user_id', userId);

  return {
    progress_overview: progress || []
  };
}

async function getSMECharts(userId) {
  const { data: projects } = await supabase
    .from('projects')
    .select('*, project_tasks(*)')
    .eq('client_id', userId);

  return {
    project_progress: projects?.map(project => ({
      project_name: project.title,
      completion_percentage: project.completion_percentage,
      tasks_completed: project.project_tasks?.filter(t => t.status === 'done').length || 0,
      total_tasks: project.project_tasks?.length || 0
    })) || []
  };
}

async function getAdminCharts() {
  // Admin charts for overall platform metrics
  const [serviceRequests, projects] = await Promise.all([
    supabase.from('service_requests').select('status, created_at'),
    supabase.from('projects').select('status, created_at')
  ]);

  return {
    service_request_trends: serviceRequests.data || [],
    project_status_distribution: projects.data || []
  };
}

function calculateCompletionRate(enrollmentData, courseId) {
  const courseEnrollments = enrollmentData?.filter(e => e.course_id === courseId) || [];
  const completed = courseEnrollments.filter(e => e.progress_percentage === 100).length;
  return courseEnrollments.length ? ((completed / courseEnrollments.length) * 100).toFixed(1) : 0;
}

async function generateMetrics(scope, refId, period) {
  // This function would generate specific metrics based on scope and period
  // For now, return a basic structure
  return {
    period,
    generated_at: new Date().toISOString(),
    scope,
    ref_id: refId,
    metrics: {
      views: 0,
      engagement: 0,
      completion_rate: 0
    }
  };
}