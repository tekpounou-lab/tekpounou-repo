// Netlify Functions - Services API
// File: netlify/functions/services.js

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    // Get auth token from header
    const authToken = event.headers.authorization?.replace('Bearer ', '')
    if (!authToken) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'No authorization token provided' }),
      }
    }

    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken)
    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' }),
      }
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'User profile not found' }),
      }
    }

    const method = event.httpMethod
    const path = event.path
    const pathParts = path.split('/').filter(Boolean)
    const serviceId = pathParts[pathParts.length - 1] !== 'services' ? pathParts[pathParts.length - 1] : null

    switch (method) {
      case 'GET':
        if (serviceId) {
          // Get single service
          const { data: service, error } = await supabase
            .from('services')
            .select(`
              *,
              creator:created_by(id, email, user_profiles(first_name, last_name))
            `)
            .eq('id', serviceId)
            .single()

          if (error) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Service not found' }),
            }
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ service }),
          }
        } else {
          // Get all services with filters
          const { category, status } = event.queryStringParameters || {}
          
          let query = supabase
            .from('services')
            .select(`
              *,
              creator:created_by(id, email, user_profiles(first_name, last_name))
            `)

          if (category) {
            query = query.eq('category', category)
          }

          if (status) {
            query = query.eq('status', status)
          } else {
            // Default to active services for non-admin users
            if (!['super_admin', 'admin'].includes(profile.role)) {
              query = query.eq('status', 'active')
            }
          }

          query = query.order('created_at', { ascending: false })

          const { data: services, error } = await query

          if (error) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: error.message }),
            }
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ services }),
          }
        }

      case 'POST':
        const createData = JSON.parse(event.body)
        
        // Check permissions
        if (!['super_admin', 'admin', 'teacher'].includes(profile.role)) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Insufficient permissions' }),
          }
        }

        const { data: newService, error: createError } = await supabase
          .from('services')
          .insert({
            ...createData,
            created_by: user.id,
          })
          .select()
          .single()

        if (createError) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: createError.message }),
          }
        }

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ service: newService }),
        }

      case 'PUT':
        if (!serviceId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Service ID is required' }),
          }
        }

        const updateData = JSON.parse(event.body)

        // Check if service exists and user has permission
        const { data: existingService, error: fetchError } = await supabase
          .from('services')
          .select('created_by')
          .eq('id', serviceId)
          .single()

        if (fetchError) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Service not found' }),
          }
        }

        // Check permissions
        const canUpdate = ['super_admin', 'admin'].includes(profile.role) || 
                         (profile.role === 'teacher' && existingService.created_by === user.id)

        if (!canUpdate) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Insufficient permissions' }),
          }
        }

        const { data: updatedService, error: updateError } = await supabase
          .from('services')
          .update(updateData)
          .eq('id', serviceId)
          .select()
          .single()

        if (updateError) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: updateError.message }),
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ service: updatedService }),
        }

      case 'DELETE':
        if (!serviceId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Service ID is required' }),
          }
        }

        // Check permissions
        if (!['super_admin', 'admin'].includes(profile.role)) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Insufficient permissions' }),
          }
        }

        const { error: deleteError } = await supabase
          .from('services')
          .delete()
          .eq('id', serviceId)

        if (deleteError) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: deleteError.message }),
          }
        }

        return {
          statusCode: 204,
          headers,
          body: '',
        }

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' }),
        }
    }
  } catch (error) {
    console.error('Error in services function:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}