// Netlify Functions - Service Categories API
// File: netlify/functions/service-categories.js

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
    const categoryId = pathParts[pathParts.length - 1] !== 'service-categories' ? pathParts[pathParts.length - 1] : null

    switch (method) {
      case 'GET':
        if (categoryId) {
          // Get single category with service count
          const { data: category, error } = await supabase
            .from('service_categories')
            .select(`
              *,
              service_count:services(count)
            `)
            .eq('id', categoryId)
            .single()

          if (error) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Category not found' }),
            }
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ category }),
          }
        } else {
          // Get all categories with service counts
          const { data: categories, error } = await supabase
            .from('service_categories')
            .select(`
              *,
              service_count:services(count)
            `)
            .order('name', { ascending: true })

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
            body: JSON.stringify({ categories }),
          }
        }

      case 'POST':
        // Only admins can create categories
        if (!['super_admin', 'admin'].includes(profile.role)) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Insufficient permissions' }),
          }
        }

        const createData = JSON.parse(event.body)

        const { data: newCategory, error: createError } = await supabase
          .from('service_categories')
          .insert(createData)
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
          body: JSON.stringify({ category: newCategory }),
        }

      case 'PUT':
        if (!categoryId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Category ID is required' }),
          }
        }

        // Only admins can update categories
        if (!['super_admin', 'admin'].includes(profile.role)) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Insufficient permissions' }),
          }
        }

        const updateData = JSON.parse(event.body)

        const { data: updatedCategory, error: updateError } = await supabase
          .from('service_categories')
          .update(updateData)
          .eq('id', categoryId)
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
          body: JSON.stringify({ category: updatedCategory }),
        }

      case 'DELETE':
        if (!categoryId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Category ID is required' }),
          }
        }

        // Only admins can delete categories
        if (!['super_admin', 'admin'].includes(profile.role)) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Insufficient permissions' }),
          }
        }

        // Check if category has services
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('id')
          .eq('category', categoryId)
          .limit(1)

        if (servicesError) {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Error checking category usage' }),
          }
        }

        if (services && services.length > 0) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Cannot delete category with existing services' }),
          }
        }

        const { error: deleteError } = await supabase
          .from('service_categories')
          .delete()
          .eq('id', categoryId)

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
    console.error('Error in service-categories function:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    }
  }
}