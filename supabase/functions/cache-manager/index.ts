import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CacheEntry {
  data: any
  timestamp: number
  ttl: number
}

// In-memory cache (for edge function)
const cache = new Map<string, CacheEntry>()

// Cache TTL in milliseconds
const CACHE_TTL = {
  courses: 5 * 60 * 1000, // 5 minutes
  services: 10 * 60 * 1000, // 10 minutes
  blog_posts: 3 * 60 * 1000, // 3 minutes
  analytics: 15 * 60 * 1000, // 15 minutes
  user_stats: 30 * 60 * 1000, // 30 minutes
}

function isValidCache(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < entry.ttl
}

function getCacheKey(type: string, params: Record<string, any> = {}): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|')
  return `${type}:${sortedParams}`
}

serve(async (req) => {
  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
    const type = url.searchParams.get('type')
    const operation = url.searchParams.get('operation') || 'get'

    if (!type) {
      return new Response(
        JSON.stringify({ error: 'Cache type is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle cache clear operation
    if (operation === 'clear') {
      if (type === 'all') {
        cache.clear()
      } else {
        // Clear specific cache type
        for (const key of cache.keys()) {
          if (key.startsWith(`${type}:`)) {
            cache.delete(key)
          }
        }
      }
      return new Response(
        JSON.stringify({ success: true, message: `Cache cleared for ${type}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get parameters for cache key
    const params: Record<string, any> = {}
    url.searchParams.forEach((value, key) => {
      if (key !== 'type' && key !== 'operation') {
        params[key] = value
      }
    })

    const cacheKey = getCacheKey(type, params)
    
    // Check cache first
    const cachedEntry = cache.get(cacheKey)
    if (cachedEntry && isValidCache(cachedEntry)) {
      return new Response(
        JSON.stringify({ 
          data: cachedEntry.data, 
          cached: true, 
          cacheTimestamp: cachedEntry.timestamp 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch fresh data based on type
    let data: any
    let ttl = CACHE_TTL[type as keyof typeof CACHE_TTL] || 5 * 60 * 1000

    switch (type) {
      case 'courses':
        const { data: courses, error: coursesError } = await supabaseClient
          .from('courses')
          .select(`
            id,
            title,
            description,
            category,
            difficulty_level,
            language,
            instructor_id,
            status,
            created_at,
            updated_at,
            profiles!courses_instructor_id_fkey(display_name, avatar_url)
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(params.limit || 50)

        if (coursesError) throw coursesError
        data = courses
        break

      case 'services':
        const { data: services, error: servicesError } = await supabaseClient
          .from('services')
          .select(`
            id,
            title,
            description,
            category,
            language,
            provider_id,
            status,
            created_at,
            profiles!services_provider_id_fkey(display_name, avatar_url)
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(params.limit || 50)

        if (servicesError) throw servicesError
        data = services
        break

      case 'blog_posts':
        const { data: blogPosts, error: blogError } = await supabaseClient
          .from('blog_posts')
          .select(`
            id,
            title,
            excerpt,
            category,
            language,
            author_id,
            status,
            created_at,
            updated_at,
            profiles!blog_posts_author_id_fkey(display_name, avatar_url)
          `)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(params.limit || 20)

        if (blogError) throw blogError
        data = blogPosts
        break

      case 'analytics':
        // Use materialized views for better performance
        const { data: analytics, error: analyticsError } = await supabaseClient
          .from('mv_course_analytics')
          .select('*')
          .limit(params.limit || 100)

        if (analyticsError) throw analyticsError
        data = analytics
        break

      case 'user_stats':
        const { data: userStats, error: userStatsError } = await supabaseClient
          .from('mv_user_activity')
          .select('*')
          .order('last_activity', { ascending: false })
          .limit(params.limit || 100)

        if (userStatsError) throw userStatsError
        data = userStats
        break

      case 'dashboard_stats':
        // Aggregate multiple queries for dashboard
        const [
          { count: totalUsers },
          { count: totalCourses },
          { count: totalServices },
          { count: totalBlogPosts },
          { count: activeEnrollments }
        ] = await Promise.all([
          supabaseClient.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
          supabaseClient.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'published'),
          supabaseClient.from('services').select('*', { count: 'exact', head: true }).eq('status', 'active'),
          supabaseClient.from('blog_posts').select('*', { count: 'exact', head: true }).eq('status', 'published'),
          supabaseClient.from('course_enrollments').select('*', { count: 'exact', head: true }).eq('status', 'active')
        ])

        data = {
          totalUsers,
          totalCourses,
          totalServices,
          totalBlogPosts,
          activeEnrollments,
          lastUpdated: new Date().toISOString()
        }
        break

      default:
        return new Response(
          JSON.stringify({ error: `Unknown cache type: ${type}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

    // Store in cache
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    })

    return new Response(
      JSON.stringify({ 
        data, 
        cached: false, 
        cacheKey,
        ttl 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Cache function error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { 
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
