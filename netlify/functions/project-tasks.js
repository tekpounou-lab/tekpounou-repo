// Netlify Functions - Project Tasks API
// File: netlify/functions/project-tasks.js

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
    const taskId = pathParts[pathParts.length - 1] !== 'project-tasks' ? pathParts[pathParts.length - 1] : null

    switch (method) {
      case 'GET':
        if (taskId) {
          // Get single task
          const { data: task, error } = await supabase
            .from('project_tasks')
            .select(`
              *,
              project:project_id(
                id,
                title,
                client_id,
                assigned_to,
                client:client_id(id, email, user_profiles(first_name, last_name)),
                assignee:assigned_to(id, email, user_profiles(first_name, last_name))
              ),
              assignee:assigned_to(id, email, user_profiles(first_name, last_name))
            `)
            .eq('id', taskId)
            .single()

          if (error) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Task not found' }),
            }
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ task }),
          }
        } else {
          // Get tasks with filters
          const { project_id, status, assigned_to } = event.queryStringParameters || {}
          
          let query = supabase
            .from('project_tasks')
            .select(`
              *,
              project:project_id(
                id,
                title,
                client_id,
                assigned_to,
                client:client_id(id, email, user_profiles(first_name, last_name)),
                assignee:assigned_to(id, email, user_profiles(first_name, last_name))
              ),
              assignee:assigned_to(id, email, user_profiles(first_name, last_name))
            `)

          if (project_id) {
            query = query.eq('project_id', project_id)
          }

          if (status) {
            query = query.eq('status', status)
          }

          if (assigned_to) {
            query = query.eq('assigned_to', assigned_to)
          }

          // Apply role-based filtering if no project_id specified
          if (!project_id && !['super_admin', 'admin'].includes(profile.role)) {
            // Regular users can only see tasks from their projects or assigned to them
            query = query.or(`assigned_to.eq.${user.id}`)
          }

          query = query.order('due_date', { ascending: true, nullsLast: true })
                      .order('priority', { ascending: false })

          const { data: tasks, error } = await query

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
            body: JSON.stringify({ tasks }),
          }
        }

      case 'POST':
        const createData = JSON.parse(event.body)
        
        // Check if user has permission to create tasks in this project
        if (createData.project_id) {
          const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('client_id, assigned_to')
            .eq('id', createData.project_id)
            .single()

          if (projectError) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Project not found' }),
            }
          }

          const canCreate = ['super_admin', 'admin'].includes(profile.role) || 
                           project.assigned_to === user.id

          if (!canCreate) {
            return {
              statusCode: 403,
              headers,
              body: JSON.stringify({ error: 'Insufficient permissions' }),
            }
          }
        } else {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Project ID is required' }),
          }
        }

        const { data: newTask, error: createError } = await supabase
          .from('project_tasks')
          .insert({
            ...createData,
            status: createData.status || 'todo',
            priority: createData.priority || 'medium',
          })
          .select(`
            *,
            project:project_id(
              id,
              title,
              client_id,
              assigned_to,
              client:client_id(id, email, user_profiles(first_name, last_name)),
              assignee:assigned_to(id, email, user_profiles(first_name, last_name))
            ),
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

        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ task: newTask }),
        }

      case 'PUT':
        if (!taskId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Task ID is required' }),
          }
        }

        const updateData = JSON.parse(event.body)

        // Check if task exists and user has permission
        const { data: existingTask, error: fetchError } = await supabase
          .from('project_tasks')
          .select(`
            assigned_to,
            project:project_id(client_id, assigned_to)
          `)
          .eq('id', taskId)
          .single()

        if (fetchError) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Task not found' }),
          }
        }

        // Check permissions
        const canUpdate = ['super_admin', 'admin'].includes(profile.role) || 
                         existingTask.assigned_to === user.id ||
                         existingTask.project.assigned_to === user.id

        if (!canUpdate) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Insufficient permissions' }),
          }
        }

        // If task is being marked as done, set completed_at
        if (updateData.status === 'done' && !updateData.completed_at) {
          updateData.completed_at = new Date().toISOString()
        }

        // If task is being unmarked as done, remove completed_at
        if (updateData.status !== 'done' && updateData.status) {
          updateData.completed_at = null
        }

        const { data: updatedTask, error: updateError } = await supabase
          .from('project_tasks')
          .update(updateData)
          .eq('id', taskId)
          .select(`
            *,
            project:project_id(
              id,
              title,
              client_id,
              assigned_to,
              client:client_id(id, email, user_profiles(first_name, last_name)),
              assignee:assigned_to(id, email, user_profiles(first_name, last_name))
            ),
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

        // Update project completion percentage when task status changes
        if (updateData.status) {
          await updateProjectCompletion(updatedTask.project_id)
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ task: updatedTask }),
        }

      case 'DELETE':
        if (!taskId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Task ID is required' }),
          }
        }

        // Check if task exists and user has permission
        const { data: taskToDelete, error: fetchDeleteError } = await supabase
          .from('project_tasks')
          .select(`
            project_id,
            project:project_id(assigned_to)
          `)
          .eq('id', taskId)
          .single()

        if (fetchDeleteError) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Task not found' }),
          }
        }

        // Check permissions
        const canDelete = ['super_admin', 'admin'].includes(profile.role) || 
                         taskToDelete.project.assigned_to === user.id

        if (!canDelete) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Insufficient permissions' }),
          }
        }

        const { error: deleteError } = await supabase
          .from('project_tasks')
          .delete()
          .eq('id', taskId)

        if (deleteError) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: deleteError.message }),
          }
        }

        // Update project completion percentage after task deletion
        await updateProjectCompletion(taskToDelete.project_id)

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
    console.error('Error in project-tasks function:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}

// Helper function to update project completion percentage
async function updateProjectCompletion(projectId) {
  try {
    // Get all tasks for the project
    const { data: tasks, error } = await supabase
      .from('project_tasks')
      .select('status')
      .eq('project_id', projectId)

    if (error || !tasks.length) {
      return
    }

    // Calculate completion percentage
    const completedTasks = tasks.filter(task => task.status === 'done').length
    const completionPercentage = Math.round((completedTasks / tasks.length) * 100)

    // Update project
    await supabase
      .from('projects')
      .update({ completion_percentage: completionPercentage })
      .eq('id', projectId)
  } catch (error) {
    console.error('Error updating project completion:', error)
  }
}