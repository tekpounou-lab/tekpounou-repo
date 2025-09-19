import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface MobileAPIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  metadata?: Record<string, any>
}

interface DeviceInfo {
  device_id: string
  platform: 'ios' | 'android'
  app_version: string
  os_version: string
  device_model: string
  push_token?: string
  timezone: string
  language: string
}

const MOBILE_API_VERSION = '1.0.0'

serve(async (req) => {
  try {
    // CORS headers for mobile apps
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-info, x-app-version',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'X-API-Version': MOBILE_API_VERSION,
    }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const endpoint = url.pathname.replace('/mobile-api/', '')
    const method = req.method

    // Extract device info from headers
    const deviceInfo = req.headers.get('x-device-info')
    const appVersion = req.headers.get('x-app-version')
    
    // Parse device info if provided
    let parsedDeviceInfo: DeviceInfo | null = null
    if (deviceInfo) {
      try {
        parsedDeviceInfo = JSON.parse(deviceInfo)
      } catch (e) {
        console.warn('Invalid device info header:', e)
      }
    }

    // Route handling
    const response = await handleMobileAPIRoute(
      endpoint,
      method,
      req,
      supabaseClient,
      parsedDeviceInfo
    )

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Mobile API error:', error)
    
    const errorResponse: MobileAPIResponse = {
      success: false,
      error: error.message || 'Internal server error',
      metadata: {
        timestamp: new Date().toISOString(),
        version: MOBILE_API_VERSION
      }
    }

    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      }
    })
  }
})

async function handleMobileAPIRoute(
  endpoint: string,
  method: string,
  req: Request,
  supabase: any,
  deviceInfo: DeviceInfo | null
): Promise<MobileAPIResponse> {
  const url = new URL(req.url)
  const searchParams = url.searchParams

  // Authentication check for protected endpoints
  const authToken = req.headers.get('authorization')?.replace('Bearer ', '')
  let currentUser = null
  
  if (authToken) {
    const { data: { user }, error } = await supabase.auth.getUser(authToken)
    if (!error) {
      currentUser = user
    }
  }

  switch (endpoint) {
    // Authentication endpoints
    case 'auth/login':
      return await handleMobileLogin(req, supabase, deviceInfo)

    case 'auth/register':
      return await handleMobileRegister(req, supabase, deviceInfo)

    case 'auth/refresh':
      return await handleTokenRefresh(req, supabase)

    case 'auth/logout':
      return await handleMobileLogout(req, supabase, deviceInfo)

    // User profile endpoints
    case 'user/profile':
      if (!currentUser) {
        return { success: false, error: 'Authentication required' }
      }
      return await handleUserProfile(method, req, supabase, currentUser)

    case 'user/preferences':
      if (!currentUser) {
        return { success: false, error: 'Authentication required' }
      }
      return await handleUserPreferences(method, req, supabase, currentUser)

    // Courses endpoints (optimized for mobile)
    case 'courses':
      return await handleMobileCourses(searchParams, supabase, currentUser)

    case 'courses/enrolled':
      if (!currentUser) {
        return { success: false, error: 'Authentication required' }
      }
      return await handleEnrolledCourses(searchParams, supabase, currentUser)

    case 'courses/progress':
      if (!currentUser) {
        return { success: false, error: 'Authentication required' }
      }
      return await handleCourseProgress(method, req, supabase, currentUser)

    // Services endpoints
    case 'services':
      return await handleMobileServices(searchParams, supabase, currentUser)

    case 'services/requests':
      if (!currentUser) {
        return { success: false, error: 'Authentication required' }
      }
      return await handleServiceRequests(method, req, supabase, currentUser)

    // Blog endpoints
    case 'blog/posts':
      return await handleMobileBlogPosts(searchParams, supabase)

    case 'blog/categories':
      return await handleBlogCategories(supabase)

    // Notifications endpoints
    case 'notifications':
      if (!currentUser) {
        return { success: false, error: 'Authentication required' }
      }
      return await handleMobileNotifications(method, req, supabase, currentUser)

    case 'notifications/register-device':
      if (!currentUser) {
        return { success: false, error: 'Authentication required' }
      }
      return await handleDeviceRegistration(req, supabase, currentUser, deviceInfo)

    // Search endpoints
    case 'search':
      return await handleMobileSearch(searchParams, supabase, currentUser)

    // Analytics endpoints
    case 'analytics/track':
      return await handleMobileAnalytics(req, supabase, currentUser, deviceInfo)

    // App configuration
    case 'config':
      return await handleAppConfig(supabase, deviceInfo)

    default:
      return {
        success: false,
        error: `Endpoint not found: ${endpoint}`,
        metadata: { availableEndpoints: getAvailableEndpoints() }
      }
  }
}

// Authentication handlers
async function handleMobileLogin(req: Request, supabase: any, deviceInfo: DeviceInfo | null): Promise<MobileAPIResponse> {
  const body = await req.json()
  const { email, password } = body

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Update device info if provided
  if (deviceInfo && data.user) {
    await updateUserDevice(supabase, data.user.id, deviceInfo)
  }

  return {
    success: true,
    data: {
      user: data.user,
      session: data.session,
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token
    }
  }
}

async function handleMobileRegister(req: Request, supabase: any, deviceInfo: DeviceInfo | null): Promise<MobileAPIResponse> {
  const body = await req.json()
  const { email, password, display_name } = body

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name,
        mobile_app: true
      }
    }
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Create profile
  if (data.user) {
    await supabase.from('profiles').insert({
      id: data.user.id,
      display_name,
      mobile_app_user: true
    })

    // Update device info if provided
    if (deviceInfo) {
      await updateUserDevice(supabase, data.user.id, deviceInfo)
    }
  }

  return {
    success: true,
    data: {
      user: data.user,
      session: data.session,
      message: 'Account created successfully'
    }
  }
}

// Course handlers
async function handleMobileCourses(searchParams: URLSearchParams, supabase: any, currentUser: any): Promise<MobileAPIResponse> {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50) // Max 50 items
  const category = searchParams.get('category')
  const language = searchParams.get('language') || 'ht-HT'
  const search = searchParams.get('search')

  let query = supabase
    .from('courses')
    .select(`
      id,
      title,
      description,
      category,
      difficulty_level,
      language,
      instructor_id,
      thumbnail_url,
      duration_hours,
      created_at,
      profiles!courses_instructor_id_fkey(display_name, avatar_url)
    `)
    .eq('status', 'published')
    .eq('language', language)

  if (category) {
    query = query.eq('category', category)
  }

  if (search) {
    query = query.ilike('title', `%${search}%`)
  }

  // Pagination
  const offset = (page - 1) * limit
  query = query.range(offset, offset + limit - 1)

  const { data: courses, error, count } = await query

  if (error) {
    return { success: false, error: error.message }
  }

  // Get enrollment status for authenticated users
  if (currentUser && courses) {
    const courseIds = courses.map(c => c.id)
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select('course_id, status, progress_percentage')
      .eq('user_id', currentUser.id)
      .in('course_id', courseIds)

    // Add enrollment info to courses
    courses.forEach(course => {
      const enrollment = enrollments?.find(e => e.course_id === course.id)
      course.enrollment = enrollment || null
    })
  }

  return {
    success: true,
    data: courses,
    pagination: {
      page,
      limit,
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    }
  }
}

async function handleEnrolledCourses(searchParams: URLSearchParams, supabase: any, currentUser: any): Promise<MobileAPIResponse> {
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const status = searchParams.get('status') || 'active'

  const offset = (page - 1) * limit

  const { data: enrollments, error, count } = await supabase
    .from('course_enrollments')
    .select(`
      id,
      status,
      progress_percentage,
      enrolled_at,
      last_accessed,
      courses(
        id,
        title,
        description,
        category,
        difficulty_level,
        thumbnail_url,
        duration_hours,
        profiles!courses_instructor_id_fkey(display_name, avatar_url)
      )
    `)
    .eq('user_id', currentUser.id)
    .eq('status', status)
    .range(offset, offset + limit - 1)
    .order('last_accessed', { ascending: false })

  if (error) {
    return { success: false, error: error.message }
  }

  return {
    success: true,
    data: enrollments,
    pagination: {
      page,
      limit,
      total: count || 0,
      hasMore: (count || 0) > offset + limit
    }
  }
}

// Helper functions
async function updateUserDevice(supabase: any, userId: string, deviceInfo: DeviceInfo) {
  try {
    await supabase.from('user_devices').upsert({
      user_id: userId,
      device_id: deviceInfo.device_id,
      platform: deviceInfo.platform,
      app_version: deviceInfo.app_version,
      os_version: deviceInfo.os_version,
      device_model: deviceInfo.device_model,
      push_token: deviceInfo.push_token,
      timezone: deviceInfo.timezone,
      language: deviceInfo.language,
      last_seen: new Date().toISOString()
    })
  } catch (error) {
    console.error('Failed to update device info:', error)
  }
}

async function handleAppConfig(supabase: any, deviceInfo: DeviceInfo | null): Promise<MobileAPIResponse> {
  // Return app configuration for mobile clients
  const config = {
    api_version: MOBILE_API_VERSION,
    features: {
      push_notifications: true,
      offline_mode: true,
      biometric_auth: true,
      dark_mode: true,
      multilingual: true
    },
    supported_languages: ['ht-HT', 'en-US', 'fr-FR'],
    cache_policies: {
      courses: { ttl: 300 }, // 5 minutes
      user_profile: { ttl: 600 }, // 10 minutes
      blog_posts: { ttl: 180 } // 3 minutes
    },
    endpoints: getAvailableEndpoints(),
    minimum_app_version: {
      ios: '1.0.0',
      android: '1.0.0'
    }
  }

  return { success: true, data: config }
}

function getAvailableEndpoints(): string[] {
  return [
    'auth/login',
    'auth/register',
    'auth/refresh',
    'auth/logout',
    'user/profile',
    'user/preferences',
    'courses',
    'courses/enrolled',
    'courses/progress',
    'services',
    'services/requests',
    'blog/posts',
    'blog/categories',
    'notifications',
    'notifications/register-device',
    'search',
    'analytics/track',
    'config'
  ]
}

// Add more handler functions for other endpoints...
async function handleMobileNotifications(method: string, req: Request, supabase: any, currentUser: any): Promise<MobileAPIResponse> {
  if (method === 'GET') {
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50)
    const unreadOnly = url.searchParams.get('unread_only') === 'true'

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const offset = (page - 1) * limit
    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      }
    }
  }

  if (method === 'PUT') {
    // Mark notifications as read
    const body = await req.json()
    const { notification_ids, mark_all = false } = body

    let query = supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', currentUser.id)

    if (!mark_all && notification_ids) {
      query = query.in('id', notification_ids)
    }

    const { error } = await query

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, message: 'Notifications marked as read' }
  }

  return { success: false, error: 'Method not allowed' }
}

async function handleMobileSearch(searchParams: URLSearchParams, supabase: any, currentUser: any): Promise<MobileAPIResponse> {
  const query = searchParams.get('q')
  const type = searchParams.get('type') || 'all' // courses, services, blog, all
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)

  if (!query) {
    return { success: false, error: 'Search query is required' }
  }

  const results: any = {}

  if (type === 'all' || type === 'courses') {
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, description, category, thumbnail_url')
      .eq('status', 'published')
      .ilike('title', `%${query}%`)
      .limit(limit)

    results.courses = courses || []
  }

  if (type === 'all' || type === 'services') {
    const { data: services } = await supabase
      .from('services')
      .select('id, title, description, category')
      .eq('status', 'active')
      .ilike('title', `%${query}%`)
      .limit(limit)

    results.services = services || []
  }

  if (type === 'all' || type === 'blog') {
    const { data: blogPosts } = await supabase
      .from('blog_posts')
      .select('id, title, excerpt, category')
      .eq('status', 'published')
      .ilike('title', `%${query}%`)
      .limit(limit)

    results.blog_posts = blogPosts || []
  }

  return {
    success: true,
    data: results,
    metadata: {
      query,
      type,
      total_results: Object.values(results).reduce((sum: number, arr: any) => sum + arr.length, 0)
    }
  }
}
