import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...payload } = await req.json()

    switch (action) {
      case 'track_event':
        return await trackEvent(supabaseClient, payload, req)
      
      case 'track_social_share':
        return await trackSocialShare(supabaseClient, payload, req)
      
      case 'track_page_view':
        return await trackPageView(supabaseClient, payload, req)
      
      case 'get_analytics_data':
        return await getAnalyticsData(supabaseClient, payload)
      
      case 'get_growth_metrics':
        return await getGrowthMetrics(supabaseClient, payload)
      
      case 'track_conversion':
        return await trackConversion(supabaseClient, payload, req)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function trackEvent(supabase: any, payload: any, req: Request) {
  const {
    eventType,
    value = 1,
    userId,
    sessionId,
    source,
    medium,
    campaign,
    utmParams,
    relatedId,
    relatedType,
    metadata = {}
  } = payload

  // Extract user agent and IP
  const userAgent = req.headers.get('user-agent') || ''
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
  const referrer = req.headers.get('referer') || ''

  // Parse device info from user agent
  const deviceInfo = parseUserAgent(userAgent)

  // Track the event
  const { data, error } = await supabase.rpc('track_growth_metric', {
    p_metric_type: eventType,
    p_metric_value: value,
    p_user_id: userId,
    p_source: source,
    p_medium: medium,
    p_campaign: campaign,
    p_utm_source: utmParams?.utm_source,
    p_utm_medium: utmParams?.utm_medium,
    p_utm_campaign: utmParams?.utm_campaign,
    p_related_id: relatedId,
    p_related_type: relatedType
  })

  if (error) throw error

  // Also insert detailed tracking data
  await supabase
    .from('growth_metrics')
    .update({
      session_id: sessionId,
      utm_term: utmParams?.utm_term,
      utm_content: utmParams?.utm_content,
      referrer_url: referrer,
      ip_address: ip,
      user_agent: userAgent,
      device_type: deviceInfo.deviceType,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      metadata: { ...metadata, ...deviceInfo }
    })
    .eq('id', data)

  return new Response(
    JSON.stringify({ message: 'Event tracked successfully', eventId: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function trackSocialShare(supabase: any, payload: any, req: Request) {
  const {
    contentType,
    contentId,
    platform,
    userId,
    sessionId,
    sharedUrl
  } = payload

  const userAgent = req.headers.get('user-agent') || ''
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''

  const { data, error } = await supabase
    .from('social_shares')
    .insert([{
      content_type: contentType,
      content_id: contentId,
      platform: platform,
      user_id: userId,
      session_id: sessionId,
      shared_url: sharedUrl,
      ip_address: ip,
      user_agent: userAgent
    }])
    .select()
    .single()

  if (error) throw error

  // Also track as growth metric
  await supabase.rpc('track_growth_metric', {
    p_metric_type: 'social_share',
    p_user_id: userId,
    p_source: 'social',
    p_medium: platform,
    p_related_id: contentId,
    p_related_type: contentType
  })

  return new Response(
    JSON.stringify({ message: 'Social share tracked successfully', shareId: data.id }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function trackPageView(supabase: any, payload: any, req: Request) {
  const {
    page,
    title,
    userId,
    sessionId,
    utmParams,
    metadata = {}
  } = payload

  const userAgent = req.headers.get('user-agent') || ''
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
  const referrer = req.headers.get('referer') || ''

  const deviceInfo = parseUserAgent(userAgent)

  await supabase.rpc('track_growth_metric', {
    p_metric_type: 'page_view',
    p_user_id: userId,
    p_utm_source: utmParams?.utm_source,
    p_utm_medium: utmParams?.utm_medium,
    p_utm_campaign: utmParams?.utm_campaign
  })

  return new Response(
    JSON.stringify({ message: 'Page view tracked successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function trackConversion(supabase: any, payload: any, req: Request) {
  const {
    conversionType, // 'signup', 'enrollment', 'purchase', 'subscription'
    value,
    userId,
    sessionId,
    courseId,
    serviceId,
    referralCode,
    metadata = {}
  } = payload

  // Track the conversion
  await supabase.rpc('track_growth_metric', {
    p_metric_type: conversionType,
    p_metric_value: value || 1,
    p_user_id: userId,
    p_related_id: courseId || serviceId,
    p_related_type: courseId ? 'course' : (serviceId ? 'service' : null)
  })

  // If this was from a referral, update the referral status
  if (referralCode) {
    const { data: referral } = await supabase
      .from('referrals')
      .select('*')
      .eq('referral_code', referralCode)
      .single()

    if (referral && referral.status === 'registered') {
      await supabase
        .from('referrals')
        .update({
          status: 'converted',
          converted_at: new Date().toISOString(),
          referee_id: userId
        })
        .eq('id', referral.id)

      // Track referral conversion
      await supabase.rpc('track_growth_metric', {
        p_metric_type: 'referral_conversion',
        p_user_id: referral.referrer_id,
        p_related_id: referral.id,
        p_related_type: 'referral'
      })
    }
  }

  return new Response(
    JSON.stringify({ message: 'Conversion tracked successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAnalyticsData(supabase: any, payload: any) {
  const {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate = new Date().toISOString().split('T')[0],
    metricTypes,
    groupBy = 'day'
  } = payload

  let query = supabase
    .from('growth_metrics')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  if (metricTypes && metricTypes.length > 0) {
    query = query.in('metric_type', metricTypes)
  }

  const { data, error } = await query.order('created_at', { ascending: true })

  if (error) throw error

  // Group data by specified period
  const groupedData = groupDataByPeriod(data, groupBy)

  return new Response(
    JSON.stringify({ data: groupedData }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getGrowthMetrics(supabase: any, payload: any) {
  const {
    startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate = new Date().toISOString().split('T')[0]
  } = payload

  const { data, error } = await supabase.rpc('get_growth_stats', {
    start_date: startDate,
    end_date: endDate
  })

  if (error) throw error

  // Get additional metrics
  const [
    newsletterStats,
    referralStats,
    socialShareStats,
    topSources
  ] = await Promise.all([
    getNewsletterStats(supabase, startDate, endDate),
    getReferralStats(supabase, startDate, endDate),
    getSocialShareStats(supabase, startDate, endDate),
    getTopTrafficSources(supabase, startDate, endDate)
  ])

  return new Response(
    JSON.stringify({
      growthMetrics: data,
      newsletterStats,
      referralStats,
      socialShareStats,
      topSources
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getNewsletterStats(supabase: any, startDate: string, endDate: string) {
  const { data: subscribers, error } = await supabase
    .from('newsletter_subscribers')
    .select('status, source, created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  if (error) throw error

  const totalSubscribers = subscribers.length
  const activeSubscribers = subscribers.filter(s => s.status === 'active').length
  const unsubscribed = subscribers.filter(s => s.status === 'unsubscribed').length

  const sourceBreakdown = subscribers.reduce((acc, sub) => {
    acc[sub.source] = (acc[sub.source] || 0) + 1
    return acc
  }, {})

  return {
    totalSubscribers,
    activeSubscribers,
    unsubscribed,
    unsubscribeRate: totalSubscribers > 0 ? (unsubscribed / totalSubscribers * 100) : 0,
    sourceBreakdown
  }
}

async function getReferralStats(supabase: any, startDate: string, endDate: string) {
  const { data: referrals, error } = await supabase
    .from('referrals')
    .select('status, reward_value, created_at, converted_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  if (error) throw error

  const totalReferrals = referrals.length
  const convertedReferrals = referrals.filter(r => r.status === 'converted').length
  const conversionRate = totalReferrals > 0 ? (convertedReferrals / totalReferrals * 100) : 0
  const totalRewardValue = referrals
    .filter(r => r.status === 'converted')
    .reduce((sum, r) => sum + (r.reward_value || 0), 0)

  return {
    totalReferrals,
    convertedReferrals,
    conversionRate,
    totalRewardValue
  }
}

async function getSocialShareStats(supabase: any, startDate: string, endDate: string) {
  const { data: shares, error } = await supabase
    .from('social_shares')
    .select('platform, content_type, created_at')
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  if (error) throw error

  const totalShares = shares.length
  const platformBreakdown = shares.reduce((acc, share) => {
    acc[share.platform] = (acc[share.platform] || 0) + 1
    return acc
  }, {})

  const contentTypeBreakdown = shares.reduce((acc, share) => {
    acc[share.content_type] = (acc[share.content_type] || 0) + 1
    return acc
  }, {})

  return {
    totalShares,
    platformBreakdown,
    contentTypeBreakdown
  }
}

async function getTopTrafficSources(supabase: any, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('growth_metrics')
    .select('source, utm_source, utm_medium, utm_campaign')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .eq('metric_type', 'page_view')

  if (error) throw error

  const sourceStats = data.reduce((acc, metric) => {
    const source = metric.utm_source || metric.source || 'direct'
    acc[source] = (acc[source] || 0) + 1
    return acc
  }, {})

  const mediumStats = data.reduce((acc, metric) => {
    const medium = metric.utm_medium || 'none'
    acc[medium] = (acc[medium] || 0) + 1
    return acc
  }, {})

  const campaignStats = data.reduce((acc, metric) => {
    if (metric.utm_campaign) {
      acc[metric.utm_campaign] = (acc[metric.utm_campaign] || 0) + 1
    }
    return acc
  }, {})

  return {
    sources: Object.entries(sourceStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10),
    mediums: Object.entries(mediumStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10),
    campaigns: Object.entries(campaignStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
  }
}

function parseUserAgent(userAgent: string) {
  // Simple user agent parsing - in production, consider using a proper library
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent)
  const isTablet = /iPad|Tablet/.test(userAgent)
  
  let deviceType = 'desktop'
  if (isTablet) deviceType = 'tablet'
  else if (isMobile) deviceType = 'mobile'

  let browser = 'unknown'
  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Edge')) browser = 'Edge'

  let os = 'unknown'
  if (userAgent.includes('Windows')) os = 'Windows'
  else if (userAgent.includes('Mac')) os = 'macOS'
  else if (userAgent.includes('Linux')) os = 'Linux'
  else if (userAgent.includes('Android')) os = 'Android'
  else if (userAgent.includes('iOS')) os = 'iOS'

  return { deviceType, browser, os }
}

function groupDataByPeriod(data: any[], groupBy: string) {
  const groups = {}
  
  data.forEach(item => {
    const date = new Date(item.created_at)
    let key: string
    
    switch (groupBy) {
      case 'hour':
        key = date.toISOString().substring(0, 13) + ':00:00Z'
        break
      case 'day':
        key = date.toISOString().substring(0, 10)
        break
      case 'week':
        const weekStart = new Date(date.setDate(date.getDate() - date.getDay()))
        key = weekStart.toISOString().substring(0, 10)
        break
      case 'month':
        key = date.toISOString().substring(0, 7)
        break
      default:
        key = date.toISOString().substring(0, 10)
    }
    
    if (!groups[key]) {
      groups[key] = {}
    }
    
    if (!groups[key][item.metric_type]) {
      groups[key][item.metric_type] = { count: 0, value: 0 }
    }
    
    groups[key][item.metric_type].count += 1
    groups[key][item.metric_type].value += parseFloat(item.metric_value || 0)
  })
  
  return groups
}
