// Netlify Functions - Service Requests API
// File: netlify/functions/service-requests.js

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
    const requestId = pathParts[pathParts.length - 1] !== 'service-requests' ? pathParts[pathParts.length - 1] : null

    switch (method) {
      case 'GET':
        if (requestId) {
          // Get single service request
          const { data: serviceRequest, error } = await supabase
            .from('service_requests')
            .select(`
              *,
              service:service_id(*),
              client:client_id(id, email, user_profiles(first_name, last_name))
            `)
            .eq('id', requestId)
            .single()

          if (error) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Service request not found' }),
            }
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ serviceRequest }),
          }
        } else {
          // Get service requests with filters
          const { status, client_id } = event.queryStringParameters || {}
          
          let query = supabase
            .from('service_requests')
            .select(`
              *,
              service:service_id(*),
              client:client_id(id, email, user_profiles(first_name, last_name))
            `)

          // Apply role-based filtering
          if (['super_admin', 'admin'].includes(profile.role)) {
            // Admins can see all requests
            if (status) {
              query = query.eq('status', status)
            }
            if (client_id) {
              query = query.eq('client_id', client_id)
            }
          } else {
            // Regular users can only see their own requests
            query = query.eq('client_id', user.id)
            if (status) {
              query = query.eq('status', status)
            }
          }

          query = query.order('created_at', { ascending: false })

          const { data: serviceRequests, error } = await query

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
            body: JSON.stringify({ serviceRequests }),
          }
        }

      case 'POST':
        const createData = JSON.parse(event.body)
        
        // Users can create service requests for themselves
        const { data: newRequest, error: createError } = await supabase
          .from('service_requests')
          .insert({
            ...createData,
            client_id: user.id,
            status: 'pending',
          })
          .select(`
            *,
            service:service_id(*),
            client:client_id(id, email, user_profiles(first_name, last_name))
          `)
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
          body: JSON.stringify({ serviceRequest: newRequest }),
        }

      case 'PUT':
        if (!requestId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Request ID is required' }),
          }
        }

        const updateData = JSON.parse(event.body)

        // Check if request exists and user has permission
        const { data: existingRequest, error: fetchError } = await supabase
          .from('service_requests')
          .select('client_id, status')
          .eq('id', requestId)
          .single()

        if (fetchError) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Service request not found' }),
          }
        }

        // Check permissions
        const canUpdate = ['super_admin', 'admin'].includes(profile.role) || 
                         existingRequest.client_id === user.id

        if (!canUpdate) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Insufficient permissions' }),
          }
        }

        // Clients can only update their own pending requests
        if (existingRequest.client_id === user.id && !['super_admin', 'admin'].includes(profile.role)) {
          if (existingRequest.status !== 'pending') {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({ error: 'Cannot update non-pending requests' }),
            }
          }
          // Remove status from update data for clients
          delete updateData.status
          delete updateData.admin_notes
        }

        const { data: updatedRequest, error: updateError } = await supabase
          .from('service_requests')
          .update(updateData)
          .eq('id', requestId)
          .select(`
            *,
            service:service_id(*),
            client:client_id(id, email, user_profiles(first_name, last_name))
          `)
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
          body: JSON.stringify({ serviceRequest: updatedRequest }),
        }

      case 'DELETE':
        if (!requestId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Request ID is required' }),
          }
        }

        // Check if request exists and user has permission
        const { data: requestToDelete, error: fetchDeleteError } = await supabase
          .from('service_requests')
          .select('client_id, status')
          .eq('id', requestId)
          .single()

        if (fetchDeleteError) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Service request not found' }),
          }
        }

        // Check permissions
        const canDelete = ['super_admin', 'admin'].includes(profile.role) || 
                         (requestToDelete.client_id === user.id && requestToDelete.status === 'pending')

        if (!canDelete) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Insufficient permissions' }),
          }
        }

        const { error: deleteError } = await supabase
          .from('service_requests')
          .delete()
          .eq('id', requestId)

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
    console.error('Error in service-requests function:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}