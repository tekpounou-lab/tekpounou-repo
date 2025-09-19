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

    if (event.httpMethod === 'POST') {
      const { event_type, metadata = {}, session_id } = JSON.parse(event.body);

      if (!event_type) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Event type is required' })
        };
      }

      // Get client IP and user agent
      const ip_address = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
      const user_agent = event.headers['user-agent'] || 'unknown';

      const { data, error } = await supabase
        .from('analytics_events')
        .insert({
          user_id: user?.id || null,
          event_type,
          metadata,
          session_id,
          ip_address,
          user_agent
        })
        .select();

      if (error) {
        console.error('Analytics event error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to log analytics event' })
        };
      }

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ success: true, event: data[0] })
      };
    }

    if (event.httpMethod === 'GET') {
      if (!user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authentication required' })
        };
      }

      const queryParams = event.queryStringParameters || {};
      const { 
        event_type, 
        limit = 100, 
        offset = 0,
        start_date,
        end_date 
      } = queryParams;

      let query = supabase
        .from('analytics_events')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (event_type) {
        query = query.eq('event_type', event_type);
      }

      if (start_date) {
        query = query.gte('created_at', start_date);
      }

      if (end_date) {
        query = query.lte('created_at', end_date);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Analytics events fetch error:', error);
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'Failed to fetch analytics events' })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Analytics events function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};