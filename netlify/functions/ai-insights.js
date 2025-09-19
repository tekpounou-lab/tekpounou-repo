const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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

    if (event.httpMethod === 'GET') {
      const queryParams = event.queryStringParameters || {};
      const { insight_type = 'general', scope } = queryParams;

      const insights = await generateInsights(user.id, profile.role, insight_type, scope);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(insights)
      };
    }

    if (event.httpMethod === 'POST') {
      const { insight_type, context, scope } = JSON.parse(event.body);

      const customInsights = await generateCustomInsights(
        user.id, 
        profile.role, 
        insight_type, 
        context, 
        scope
      );

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(customInsights)
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('AI insights function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

async function generateInsights(userId, userRole, insightType, scope) {
  const insights = {
    type: insightType,
    generated_at: new Date().toISOString(),
    user_role: userRole,
    insights: []
  };

  try {
    switch (userRole) {
      case 'super_admin':
        insights.insights = await generateSuperAdminInsights(insightType);
        break;
      case 'admin':
        insights.insights = await generateAdminInsights(insightType);
        break;
      case 'teacher':
        insights.insights = await generateTeacherInsights(userId, insightType);
        break;
      case 'sme_client':
        insights.insights = await generateSMEInsights(userId, insightType);
        break;
      default:
        insights.insights = await generateStudentInsights(userId, insightType);
    }
  } catch (error) {
    console.error('Insight generation error:', error);
    insights.insights = [
      {
        type: 'error',
        title: 'Insight Generation Error',
        message: 'Unable to generate insights at this time',
        priority: 'low'
      }
    ];
  }

  return insights;
}

async function generateSuperAdminInsights(insightType) {
  const insights = [];

  // Platform Overview Insights
  const { data: recentUsers } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const { data: popularCourses } = await supabase
    .from('courses')
    .select('title, (enrollments:enrollments(count))')
    .order('enrollments.count', { ascending: false })
    .limit(3);

  const { data: activeServices } = await supabase
    .from('service_requests')
    .select('status')
    .eq('status', 'pending');

  insights.push({
    type: 'metric',
    title: 'Platform Growth',
    message: `${recentUsers?.length || 0} new users joined this week`,
    priority: 'high',
    action: 'Consider reviewing onboarding process'
  });

  if (popularCourses?.length > 0) {
    insights.push({
      type: 'recommendation',
      title: 'Popular Content',
      message: `"${popularCourses[0]?.title}" is trending with high enrollments`,
      priority: 'medium',
      action: 'Promote similar courses or expand this topic'
    });
  }

  insights.push({
    type: 'alert',
    title: 'Service Requests',
    message: `${activeServices?.length || 0} service requests pending review`,
    priority: activeServices?.length > 5 ? 'high' : 'medium',
    action: 'Review and assign pending service requests'
  });

  // Placeholder for future AI-powered insights
  insights.push({
    type: 'ai_placeholder',
    title: 'AI-Powered Platform Insights',
    message: 'Advanced analytics and predictive insights will be available here',
    priority: 'low',
    action: 'Coming soon with AI integration'
  });

  return insights;
}

async function generateAdminInsights(insightType) {
  const insights = [];

  const { data: pendingRequests } = await supabase
    .from('service_requests')
    .select('*')
    .eq('status', 'pending');

  const { data: overdueProjects } = await supabase
    .from('projects')
    .select('title, updated_at')
    .eq('status', 'active')
    .lt('updated_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString());

  insights.push({
    type: 'task',
    title: 'Pending Service Requests',
    message: `${pendingRequests?.length || 0} service requests need attention`,
    priority: pendingRequests?.length > 0 ? 'high' : 'low',
    action: 'Review and process pending requests'
  });

  insights.push({
    type: 'alert',
    title: 'Project Management',
    message: `${overdueProjects?.length || 0} projects haven't been updated in 2+ weeks`,
    priority: overdueProjects?.length > 0 ? 'medium' : 'low',
    action: 'Check project status and update progress'
  });

  return insights;
}

async function generateTeacherInsights(userId, insightType) {
  const insights = [];

  const { data: courses } = await supabase
    .from('courses')
    .select('id, title, (enrollments:enrollments(count, progress_percentage))')
    .eq('instructor_id', userId);

  if (courses?.length > 0) {
    const totalEnrollments = courses.reduce((sum, course) => 
      sum + (course.enrollments?.length || 0), 0);

    const avgCompletion = courses.reduce((sum, course) => {
      const completions = course.enrollments?.filter(e => e.progress_percentage === 100).length || 0;
      const enrollments = course.enrollments?.length || 1;
      return sum + (completions / enrollments * 100);
    }, 0) / courses.length;

    insights.push({
      type: 'metric',
      title: 'Teaching Performance',
      message: `Your courses have ${totalEnrollments} total enrollments with ${avgCompletion.toFixed(1)}% average completion rate`,
      priority: 'medium',
      action: avgCompletion < 70 ? 'Consider improving course engagement' : 'Great job!'
    });

    // Find best performing course
    const bestCourse = courses.reduce((best, course) => {
      const completion = course.enrollments?.filter(e => e.progress_percentage === 100).length || 0;
      const enrolled = course.enrollments?.length || 1;
      const rate = completion / enrolled;
      return rate > (best?.rate || 0) ? { ...course, rate } : best;
    }, null);

    if (bestCourse) {
      insights.push({
        type: 'success',
        title: 'Top Performing Course',
        message: `"${bestCourse.title}" has the highest completion rate`,
        priority: 'low',
        action: 'Consider what makes this course successful'
      });
    }
  }

  return insights;
}

async function generateSMEInsights(userId, insightType) {
  const insights = [];

  const { data: projects } = await supabase
    .from('projects')
    .select('*, project_tasks(*)')
    .eq('client_id', userId)
    .eq('status', 'active');

  const { data: requests } = await supabase
    .from('service_requests')
    .select('*')
    .eq('client_id', userId);

  if (projects?.length > 0) {
    const overallProgress = projects.reduce((sum, project) => 
      sum + (project.completion_percentage || 0), 0) / projects.length;

    insights.push({
      type: 'metric',
      title: 'Project Progress',
      message: `Your active projects are ${overallProgress.toFixed(1)}% complete on average`,
      priority: 'medium',
      action: overallProgress < 50 ? 'Follow up on project progress' : 'Projects are on track'
    });

    // Find projects needing attention
    const stalledProjects = projects.filter(p => 
      new Date(p.updated_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));

    if (stalledProjects.length > 0) {
      insights.push({
        type: 'alert',
        title: 'Stalled Projects',
        message: `${stalledProjects.length} project(s) haven't been updated recently`,
        priority: 'high',
        action: 'Contact project manager for updates'
      });
    }
  }

  insights.push({
    type: 'recommendation',
    title: 'Service Recommendations',
    message: 'Based on your project history, you might be interested in additional services',
    priority: 'low',
    action: 'Browse our service marketplace for complementary offerings'
  });

  return insights;
}

async function generateStudentInsights(userId, insightType) {
  const insights = [];

  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('*, courses(title, category)')
    .eq('user_id', userId);

  if (enrollments?.length > 0) {
    const avgProgress = enrollments.reduce((sum, e) => 
      sum + (e.progress_percentage || 0), 0) / enrollments.length;

    const completed = enrollments.filter(e => e.progress_percentage === 100).length;

    insights.push({
      type: 'metric',
      title: 'Learning Progress',
      message: `You're ${avgProgress.toFixed(1)}% through your enrolled courses on average`,
      priority: 'medium',
      action: avgProgress < 30 ? 'Consider focusing on fewer courses' : 'Keep up the great work!'
    });

    insights.push({
      type: 'achievement',
      title: 'Courses Completed',
      message: `You've completed ${completed} out of ${enrollments.length} enrolled courses`,
      priority: 'low',
      action: 'Celebrate your achievements!'
    });

    // Find courses to continue
    const inProgress = enrollments.filter(e => 
      e.progress_percentage > 0 && e.progress_percentage < 100);

    if (inProgress.length > 0) {
      const nextCourse = inProgress.sort((a, b) => b.progress_percentage - a.progress_percentage)[0];
      insights.push({
        type: 'recommendation',
        title: 'Continue Learning',
        message: `Continue with "${nextCourse.courses?.title}" - you're ${nextCourse.progress_percentage}% done`,
        priority: 'medium',
        action: 'Resume your learning journey'
      });
    }
  }

  return insights;
}

async function generateCustomInsights(userId, userRole, insightType, context, scope) {
  // Placeholder for custom AI insights based on specific context
  return {
    type: 'custom',
    generated_at: new Date().toISOString(),
    context,
    scope,
    insights: [
      {
        type: 'ai_placeholder',
        title: 'Custom AI Insights',
        message: 'Advanced AI-powered custom insights will be available here',
        priority: 'low',
        action: 'Feature coming soon with AI integration',
        context: context
      }
    ]
  };
}