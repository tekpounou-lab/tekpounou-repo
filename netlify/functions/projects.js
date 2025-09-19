// Netlify Functions - Projects API
// File: netlify/functions/projects.js

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
    const projectId = pathParts[pathParts.length - 1] !== 'projects' ? pathParts[pathParts.length - 1] : null

    switch (method) {
      case 'GET':
        if (projectId) {
          // Get single project with tasks
          const { data: project, error } = await supabase
            .from('projects')
            .select(`
              *,
              service_request:service_request_id(*),
              client:client_id(id, email, user_profiles(first_name, last_name)),
              assignee:assigned_to(id, email, user_profiles(first_name, last_name)),
              tasks:project_tasks(
                id,
                title,
                description,
                status,
                priority,
                due_date,
                completed_at,
                created_at,
                assigned_to(id, email, user_profiles(first_name, last_name))
              )
            `)
            .eq('id', projectId)
            .single()

          if (error) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Project not found' }),
            }
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ project }),
          }
        } else {
          // Get projects with filters
          const { status, client_id, assigned_to } = event.queryStringParameters || {}
          
          let query = supabase
            .from('projects')
            .select(`
              *,
              service_request:service_request_id(*),
              client:client_id(id, email, user_profiles(first_name, last_name)),
              assignee:assigned_to(id, email, user_profiles(first_name, last_name)),
              task_count:project_tasks(count)
            `)

          // Apply role-based filtering
          if (['super_admin', 'admin'].includes(profile.role)) {
            // Admins can see all projects
            if (status) {
              query = query.eq('status', status)
            }
            if (client_id) {
              query = query.eq('client_id', client_id)
            }
            if (assigned_to) {
              query = query.eq('assigned_to', assigned_to)
            }
          } else {
            // Regular users can only see their own projects or assigned projects
            query = query.or(`client_id.eq.${user.id},assigned_to.eq.${user.id}`)
            if (status) {
              query = query.eq('status', status)
            }
          }

          query = query.order('created_at', { ascending: false })

          const { data: projects, error } = await query

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
            body: JSON.stringify({ projects }),
          }
        }

      case 'POST':
        const createData = JSON.parse(event.body)
        
        // Only admins can create projects
        if (!['super_admin', 'admin'].includes(profile.role)) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Insufficient permissions' }),
          }
        }

        const { data: newProject, error: createError } = await supabase
          .from('projects')
          .insert({
            ...createData,
            status: createData.status || 'planning',
          })
          .select(`
            *,
            service_request:service_request_id(*),
            client:client_id(id, email, user_profiles(first_name, last_name)),
            assignee:assigned_to(id, email, user_profiles(first_name, last_name))
          `)
          .single()

        if (createError) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: createError.message }),
          }
        }

        // If created from a service request, update the request status
        if (createData.service_request_id) {
          await supabase
            .from('service_requests')
            .update({ status: 'in_progress' })
            .eq('id', createData.service_request_id)
        }

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ project: newProject }),
        }

      case 'PUT':
        if (!projectId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Project ID is required' }),
          }
        }

        const updateData = JSON.parse(event.body)

        // Check if project exists and user has permission
        const { data: existingProject, error: fetchError } = await supabase
          .from('projects')
          .select('client_id, assigned_to')
          .eq('id', projectId)
          .single()

        if (fetchError) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Project not found' }),
          }
        }

        // Check permissions
        const canUpdate = ['super_admin', 'admin'].includes(profile.role) || 
                         existingProject.assigned_to === user.id

        if (!canUpdate) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Insufficient permissions' }),
          }
        }

        // If project is being marked as completed, update completion percentage
        if (updateData.status === 'completed' && !updateData.completion_percentage) {
          updateData.completion_percentage = 100
        }

        const { data: updatedProject, error: updateError } = await supabase
          .from('projects')
          .update(updateData)
          .eq('id', projectId)
          .select(`
            *,
            service_request:service_request_id(*),
            client:client_id(id, email, user_profiles(first_name, last_name)),
            assignee:assigned_to(id, email, user_profiles(first_name, last_name))
          `)
          .single()

        if (updateError) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: updateError.message }),
          }
        }

        // If project is completed, update related service request
        if (updateData.status === 'completed' && updatedProject.service_request_id) {
          await supabase
            .from('service_requests')
            .update({ status: 'completed' })
            .eq('id', updatedProject.service_request_id)
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ project: updatedProject }),
        }

      case 'DELETE':
        if (!projectId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Project ID is required' }),
          }
        }

        // Only admins can delete projects
        if (!['super_admin', 'admin'].includes(profile.role)) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Insufficient permissions' }),
          }
        }

        const { error: deleteError } = await supabase
          .from('projects')
          .delete()
          .eq('id', projectId)

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
    console.error('Error in projects function:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}