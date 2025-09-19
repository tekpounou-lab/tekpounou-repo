import { createClient } from '@supabase/supabase-js'
import { faker } from '@faker-js/faker'

// Configure Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Set faker locale to include Haitian content
faker.setLocale('en')

interface SeedData {
  users: any[]
  profiles: any[]
  courses: any[]
  courseEnrollments: any[]
  blogPosts: any[]
  services: any[]
  serviceRequests: any[]
  notifications: any[]
  analyticsEvents: any[]
  performanceMetrics: any[]
  errorReports: any[]
  userDevices: any[]
  pushNotifications: any[]
}

// Helper functions for generating Haitian content
const haitianNames = [
  'Jean-Baptiste', 'Marie-Claire', 'Pierre-Louis', 'Roseline', 'Emmanuel',
  'Fabiola', 'Dieufaite', 'Jocelyne', 'Widelene', 'Davidson',
  'Mirlande', 'Gardy', 'Wideline', 'Peterson', 'Guerline'
]

const haitianLastNames = [
  'Joseph', 'Jean', 'Pierre', 'Louis', 'Charles', 'Michel',
  'Antoine', 'François', 'Baptiste', 'Alexandre', 'Etienne',
  'Moïse', 'Philippe', 'André', 'Paul'
]

const haitianCourseTopics = [
  'Kreyòl Ayisyen', 'Istwa Ayiti', 'Kilti Ayisyen', 'Teknoloji',
  'Kominikasyon', 'Biznis', 'Agrikilti', 'Sante', 'Edikasyon'
]

const haitianBlogTopics = [
  'Nouvel nan Teknoloji', 'Devlopman Kominotè', 'Edikasyon nan Ayiti',
  'Kilti ak Tradisyon', 'Ekonomi ak Biznis', 'Sante ak Byennèt'
]

const haitianServiceCategories = [
  'Konsèy Teknoloji', 'Devlopman Web', 'Fòmasyon', 'Konsèy Biznis',
  'Tradisyon ak Tradiksyon', 'Sipò Edikasyon'
]

function getRandomHaitianName(): string {
  const firstName = faker.helpers.arrayElement(haitianNames)
  const lastName = faker.helpers.arrayElement(haitianLastNames)
  return `${firstName} ${lastName}`
}

function generateUsers(count: number): any[] {
  const users = []
  const roles = ['student', 'teacher', 'guest']
  
  // Add super admin
  users.push({
    id: faker.datatype.uuid(),
    email: 'admin@tekpounou.com',
    role: 'super_admin',
    created_at: faker.date.past(2).toISOString(),
    updated_at: faker.date.recent().toISOString(),
    last_login: faker.date.recent().toISOString(),
    is_active: true
  })

  // Add regular admin
  users.push({
    id: faker.datatype.uuid(),
    email: 'moderator@tekpounou.com',
    role: 'admin',
    created_at: faker.date.past(1).toISOString(),
    updated_at: faker.date.recent().toISOString(),
    last_login: faker.date.recent().toISOString(),
    is_active: true
  })

  // Add teachers
  for (let i = 0; i < Math.floor(count * 0.1); i++) {
    users.push({
      id: faker.datatype.uuid(),
      email: faker.internet.email().toLowerCase(),
      role: 'teacher',
      created_at: faker.date.past(1).toISOString(),
      updated_at: faker.date.recent().toISOString(),
      last_login: faker.date.recent().toISOString(),
      is_active: faker.datatype.boolean(0.95)
    })
  }

  // Add students and guests
  for (let i = users.length; i < count; i++) {
    users.push({
      id: faker.datatype.uuid(),
      email: faker.internet.email().toLowerCase(),
      role: faker.helpers.arrayElement(roles),
      created_at: faker.date.past(1).toISOString(),
      updated_at: faker.date.recent().toISOString(),
      last_login: faker.date.recent().toISOString(),
      is_active: faker.datatype.boolean(0.9)
    })
  }

  return users
}

function generateProfiles(users: any[]): any[] {
  return users.map(user => ({
    id: user.id,
    display_name: getRandomHaitianName(),
    avatar_url: faker.image.avatar(),
    bio: faker.lorem.sentences(2),
    roles: [user.role],
    preferred_language: faker.helpers.arrayElement(['ht-HT', 'en-US', 'fr-FR']),
    created_at: user.created_at,
    updated_at: user.updated_at
  }))
}

function generateCourses(teachers: any[], count: number): any[] {
  const courses = []
  const difficulties = ['débutant', 'intermédiaire', 'avancé']
  const languages = ['ht-HT', 'en-US', 'fr-FR']

  for (let i = 0; i < count; i++) {
    const instructor = faker.helpers.arrayElement(teachers)
    const topic = faker.helpers.arrayElement(haitianCourseTopics)
    
    courses.push({
      id: faker.datatype.uuid(),
      title: `${topic} - Nivo ${faker.helpers.arrayElement(difficulties)}`,
      description: faker.lorem.paragraphs(2),
      content: JSON.stringify({
        modules: Array.from({ length: faker.datatype.number({ min: 3, max: 8 }) }, () => ({
          title: faker.lorem.words(3),
          description: faker.lorem.sentence(),
          lessons: Array.from({ length: faker.datatype.number({ min: 2, max: 6 }) }, () => ({
            title: faker.lorem.words(4),
            content: faker.lorem.paragraphs(3),
            video_url: faker.internet.url(),
            duration_minutes: faker.datatype.number({ min: 5, max: 45 })
          }))
        }))
      }),
      category: topic,
      difficulty_level: faker.helpers.arrayElement(difficulties),
      language: faker.helpers.arrayElement(languages),
      instructor_id: instructor.id,
      duration_hours: faker.datatype.number({ min: 2, max: 40 }),
      price: faker.datatype.number({ min: 0, max: 100 }),
      status: faker.helpers.arrayElement(['published', 'draft', 'archived']),
      thumbnail_url: faker.image.business(),
      created_at: faker.date.past(1).toISOString(),
      updated_at: faker.date.recent().toISOString()
    })
  }

  return courses
}

function generateCourseEnrollments(students: any[], courses: any[], count: number): any[] {
  const enrollments = []
  const statuses = ['active', 'completed', 'paused', 'cancelled']

  for (let i = 0; i < count; i++) {
    const student = faker.helpers.arrayElement(students)
    const course = faker.helpers.arrayElement(courses.filter(c => c.status === 'published'))
    
    // Avoid duplicate enrollments
    const existingEnrollment = enrollments.find(e => 
      e.user_id === student.id && e.course_id === course.id
    )
    
    if (!existingEnrollment) {
      const status = faker.helpers.arrayElement(statuses)
      const enrolledAt = faker.date.past(1)
      
      enrollments.push({
        id: faker.datatype.uuid(),
        user_id: student.id,
        course_id: course.id,
        status,
        progress_percentage: status === 'completed' 
          ? 100 
          : faker.datatype.number({ min: 0, max: 95 }),
        enrolled_at: enrolledAt.toISOString(),
        completed_at: status === 'completed' 
          ? faker.date.between(enrolledAt, new Date()).toISOString()
          : null,
        last_accessed: faker.date.recent().toISOString(),
        certificate_url: status === 'completed' 
          ? faker.internet.url()
          : null
      })
    }
  }

  return enrollments
}

function generateBlogPosts(authors: any[], count: number): any[] {
  const posts = []
  const categories = haitianBlogTopics
  const languages = ['ht-HT', 'en-US', 'fr-FR']

  for (let i = 0; i < count; i++) {
    const author = faker.helpers.arrayElement(authors)
    const category = faker.helpers.arrayElement(categories)
    
    posts.push({
      id: faker.datatype.uuid(),
      title: `${category}: ${faker.lorem.words(5)}`,
      content: faker.lorem.paragraphs(8),
      excerpt: faker.lorem.paragraph(),
      author_id: author.id,
      category,
      language: faker.helpers.arrayElement(languages),
      status: faker.helpers.arrayElement(['published', 'draft', 'archived']),
      featured_image_url: faker.image.business(),
      tags: faker.helpers.arrayElements(['teknoloji', 'edikasyon', 'kilti', 'kominotè', 'devlopman'], 
        faker.datatype.number({ min: 1, max: 3 })),
      created_at: faker.date.past(1).toISOString(),
      updated_at: faker.date.recent().toISOString(),
      published_at: faker.date.past(1).toISOString()
    })
  }

  return posts
}

function generateServices(providers: any[], count: number): any[] {
  const services = []
  const categories = haitianServiceCategories

  for (let i = 0; i < count; i++) {
    const provider = faker.helpers.arrayElement(providers)
    const category = faker.helpers.arrayElement(categories)
    
    services.push({
      id: faker.datatype.uuid(),
      title: `${category} - ${faker.lorem.words(3)}`,
      description: faker.lorem.paragraphs(2),
      category,
      provider_id: provider.id,
      language: faker.helpers.arrayElement(['ht-HT', 'en-US', 'fr-FR']),
      price_range: faker.helpers.arrayElement(['gratuit', '50-100 USD', '100-500 USD', '500+ USD']),
      status: faker.helpers.arrayElement(['active', 'inactive', 'pending']),
      contact_info: {
        email: faker.internet.email(),
        phone: faker.phone.phoneNumber(),
        availability: 'Lendi nan Vandredi, 9AM - 5PM'
      },
      created_at: faker.date.past(1).toISOString(),
      updated_at: faker.date.recent().toISOString()
    })
  }

  return services
}

function generateServiceRequests(users: any[], services: any[], count: number): any[] {
  const requests = []
  const statuses = ['pending', 'in_progress', 'completed', 'cancelled']
  const priorities = ['low', 'medium', 'high', 'urgent']

  for (let i = 0; i < count; i++) {
    const user = faker.helpers.arrayElement(users)
    const service = faker.helpers.arrayElement(services.filter(s => s.status === 'active'))
    
    requests.push({
      id: faker.datatype.uuid(),
      user_id: user.id,
      service_id: service.id,
      title: `Demann pou ${service.title}`,
      description: faker.lorem.paragraph(),
      status: faker.helpers.arrayElement(statuses),
      priority: faker.helpers.arrayElement(priorities),
      contact_preferences: {
        email: faker.datatype.boolean(),
        phone: faker.datatype.boolean(),
        platform: faker.datatype.boolean()
      },
      budget_range: faker.helpers.arrayElement(['0-50 USD', '50-200 USD', '200-500 USD', '500+ USD']),
      deadline: faker.date.future().toISOString(),
      created_at: faker.date.past(1).toISOString(),
      updated_at: faker.date.recent().toISOString()
    })
  }

  return requests
}

function generateNotifications(users: any[], count: number): any[] {
  const notifications = []
  const types = ['course_update', 'service_request', 'blog_post', 'system', 'achievement']

  for (let i = 0; i < count; i++) {
    const user = faker.helpers.arrayElement(users)
    const type = faker.helpers.arrayElement(types)
    
    notifications.push({
      id: faker.datatype.uuid(),
      user_id: user.id,
      title: `Notifikasyon ${type}`,
      message: faker.lorem.sentence(),
      type,
      data: {
        action_url: faker.internet.url(),
        priority: faker.helpers.arrayElement(['low', 'medium', 'high'])
      },
      is_read: faker.datatype.boolean(0.7),
      read_at: faker.datatype.boolean(0.7) ? faker.date.recent().toISOString() : null,
      created_at: faker.date.past(1).toISOString()
    })
  }

  return notifications
}

function generateAnalyticsEvents(users: any[], count: number): any[] {
  const events = []
  const eventTypes = [
    'page_view', 'course_access', 'course_completion', 'service_request',
    'blog_read', 'search', 'download', 'share', 'login', 'logout'
  ]
  const pages = [
    '/', '/courses', '/services', '/blog', '/dashboard', '/profile',
    '/courses/teknoloji-101', '/courses/kreyol-basics', '/services/web-dev'
  ]

  for (let i = 0; i < count; i++) {
    const user = faker.helpers.arrayElement(users)
    
    events.push({
      id: faker.datatype.uuid(),
      user_id: user.id,
      event_type: faker.helpers.arrayElement(eventTypes),
      page_path: faker.helpers.arrayElement(pages),
      session_id: faker.datatype.uuid(),
      user_agent: faker.internet.userAgent(),
      ip_address: faker.internet.ip(),
      referrer: faker.internet.url(),
      device_type: faker.helpers.arrayElement(['desktop', 'mobile', 'tablet']),
      browser: faker.helpers.arrayElement(['Chrome', 'Firefox', 'Safari', 'Edge']),
      os: faker.helpers.arrayElement(['Windows', 'macOS', 'Linux', 'iOS', 'Android']),
      country: 'Haiti',
      properties: {
        duration: faker.datatype.number({ min: 1, max: 300 }),
        scroll_depth: faker.datatype.number({ min: 0, max: 100 }),
        clicks: faker.datatype.number({ min: 0, max: 20 })
      },
      created_at: faker.date.past(1).toISOString()
    })
  }

  return events
}

function generatePerformanceMetrics(users: any[], count: number): any[] {
  const metrics = []
  const metricNames = [
    'FCP', 'LCP', 'FID', 'CLS', 'TTFB', 'page_load_time',
    'api_response_time', 'component_render_time'
  ]
  const metricTypes = ['timing', 'navigation', 'resource', 'custom']
  const pages = [
    'http://localhost:3000/',
    'http://localhost:3000/courses',
    'http://localhost:3000/services',
    'http://localhost:3000/blog',
    'http://localhost:3000/dashboard'
  ]

  for (let i = 0; i < count; i++) {
    const user = faker.helpers.arrayElement(users)
    const metricName = faker.helpers.arrayElement(metricNames)
    
    let metricValue: number
    switch (metricName) {
      case 'FCP':
      case 'LCP':
        metricValue = faker.datatype.number({ min: 800, max: 4000 })
        break
      case 'FID':
        metricValue = faker.datatype.number({ min: 10, max: 300 })
        break
      case 'CLS':
        metricValue = faker.datatype.float({ min: 0, max: 0.5, precision: 0.001 })
        break
      case 'TTFB':
        metricValue = faker.datatype.number({ min: 100, max: 800 })
        break
      default:
        metricValue = faker.datatype.number({ min: 50, max: 2000 })
    }
    
    metrics.push({
      id: faker.datatype.uuid(),
      metric_name: metricName,
      metric_value: metricValue,
      metric_type: faker.helpers.arrayElement(metricTypes),
      page_url: faker.helpers.arrayElement(pages),
      user_id: user.id,
      session_id: faker.datatype.uuid(),
      user_agent: faker.internet.userAgent(),
      device_type: faker.helpers.arrayElement(['desktop', 'mobile', 'tablet']),
      connection_type: faker.helpers.arrayElement(['4g', 'wifi', '3g']),
      timestamp: faker.date.past(1).toISOString(),
      additional_data: {
        viewport_width: faker.datatype.number({ min: 320, max: 1920 }),
        viewport_height: faker.datatype.number({ min: 568, max: 1080 })
      }
    })
  }

  return metrics
}

function generateErrorReports(users: any[], count: number): any[] {
  const errors = []
  const errorMessages = [
    'Cannot read property of undefined',
    'Network request failed',
    'Component render error',
    'State update on unmounted component',
    'API endpoint not found',
    'Authentication failed',
    'Database connection timeout'
  ]
  const boundaryLevels = ['component', 'page', 'global']

  for (let i = 0; i < count; i++) {
    const user = faker.helpers.arrayElement(users)
    
    errors.push({
      id: faker.datatype.uuid(),
      error_message: faker.helpers.arrayElement(errorMessages),
      error_stack: `Error: ${faker.helpers.arrayElement(errorMessages)}\n    at Component.render\n    at ReactDOM.render`,
      component_stack: '    in Component\n    in Router\n    in App',
      user_id: user.id,
      page_url: faker.internet.url(),
      user_agent: faker.internet.userAgent(),
      device_info: {
        platform: faker.helpers.arrayElement(['web', 'ios', 'android']),
        version: '1.0.0'
      },
      timestamp: faker.date.past(1).toISOString(),
      error_boundary_level: faker.helpers.arrayElement(boundaryLevels),
      is_resolved: faker.datatype.boolean(0.3),
      resolved_by: faker.datatype.boolean(0.3) ? faker.helpers.arrayElement(users).id : null,
      resolved_at: faker.datatype.boolean(0.3) ? faker.date.recent().toISOString() : null,
      additional_info: {
        browser: faker.helpers.arrayElement(['Chrome', 'Firefox', 'Safari']),
        os: faker.helpers.arrayElement(['Windows', 'macOS', 'Linux'])
      }
    })
  }

  return errors
}

function generateUserDevices(users: any[], count: number): any[] {
  const devices = []
  const platforms = ['ios', 'android', 'web']
  const deviceModels = [
    'iPhone 13', 'iPhone 12', 'Samsung Galaxy S21', 'Google Pixel 6',
    'iPad Air', 'MacBook Pro', 'Windows PC', 'Chrome Browser'
  ]

  for (let i = 0; i < count; i++) {
    const user = faker.helpers.arrayElement(users)
    const platform = faker.helpers.arrayElement(platforms)
    
    devices.push({
      id: faker.datatype.uuid(),
      user_id: user.id,
      device_id: faker.datatype.uuid(),
      platform,
      app_version: '1.0.0',
      os_version: platform === 'ios' ? '15.0' : platform === 'android' ? '12.0' : 'Chrome 96',
      device_model: faker.helpers.arrayElement(deviceModels),
      push_token: platform !== 'web' ? faker.datatype.uuid() : null,
      timezone: 'America/Port-au-Prince',
      language: 'ht-HT',
      is_active: faker.datatype.boolean(0.8),
      last_seen: faker.date.recent().toISOString(),
      created_at: faker.date.past(1).toISOString(),
      updated_at: faker.date.recent().toISOString()
    })
  }

  return devices
}

function generatePushNotifications(users: any[], count: number): any[] {
  const notifications = []
  const statuses = ['sent', 'delivered', 'failed', 'clicked']
  const templates = [
    'course_enrollment', 'course_reminder', 'assignment_due',
    'certificate_earned', 'service_request_update', 'blog_post_published'
  ]

  for (let i = 0; i < count; i++) {
    const user = faker.helpers.arrayElement(users)
    const template = faker.helpers.arrayElement(templates)
    const status = faker.helpers.arrayElement(statuses)
    
    notifications.push({
      id: faker.datatype.uuid(),
      user_id: user.id,
      device_id: faker.datatype.uuid(),
      template_id: null, // Will be linked to actual templates
      title: `Notifikasyon ${template}`,
      body: faker.lorem.sentence(),
      data: {
        course_id: faker.datatype.uuid(),
        deep_link: '/courses/123'
      },
      status,
      external_id: faker.datatype.uuid(),
      error_message: status === 'failed' ? 'Device token invalid' : null,
      sent_at: faker.date.past(1).toISOString(),
      delivered_at: status !== 'failed' ? faker.date.recent().toISOString() : null,
      clicked_at: status === 'clicked' ? faker.date.recent().toISOString() : null,
      created_at: faker.date.past(1).toISOString()
    })
  }

  return notifications
}

async function seedDatabase() {
  console.log('🌱 Starting database seeding...')

  try {
    // Generate all data
    console.log('📊 Generating seed data...')
    
    const users = generateUsers(500)
    const profiles = generateProfiles(users)
    
    const teachers = users.filter(u => u.role === 'teacher')
    const students = users.filter(u => u.role === 'student')
    const allActiveUsers = users.filter(u => u.is_active)
    
    const courses = generateCourses(teachers, 50)
    const courseEnrollments = generateCourseEnrollments(students, courses, 200)
    const blogPosts = generateBlogPosts(teachers, 30)
    const services = generateServices(teachers, 25)
    const serviceRequests = generateServiceRequests(allActiveUsers, services, 100)
    const notifications = generateNotifications(allActiveUsers, 300)
    const analyticsEvents = generateAnalyticsEvents(allActiveUsers, 1000)
    const performanceMetrics = generatePerformanceMetrics(allActiveUsers, 500)
    const errorReports = generateErrorReports(allActiveUsers, 50)
    const userDevices = generateUserDevices(allActiveUsers, 150)
    const pushNotifications = generatePushNotifications(allActiveUsers, 200)

    // Insert data in batches
    const batchSize = 100

    console.log('👥 Inserting users...')
    await insertInBatches('users', users, batchSize)

    console.log('👤 Inserting profiles...')
    await insertInBatches('profiles', profiles, batchSize)

    console.log('📚 Inserting courses...')
    await insertInBatches('courses', courses, batchSize)

    console.log('📝 Inserting course enrollments...')
    await insertInBatches('course_enrollments', courseEnrollments, batchSize)

    console.log('📰 Inserting blog posts...')
    await insertInBatches('blog_posts', blogPosts, batchSize)

    console.log('🛠️ Inserting services...')
    await insertInBatches('services', services, batchSize)

    console.log('📋 Inserting service requests...')
    await insertInBatches('service_requests', serviceRequests, batchSize)

    console.log('🔔 Inserting notifications...')
    await insertInBatches('notifications', notifications, batchSize)

    console.log('📈 Inserting analytics events...')
    await insertInBatches('analytics_events', analyticsEvents, batchSize)

    console.log('⚡ Inserting performance metrics...')
    await insertInBatches('performance_metrics', performanceMetrics, batchSize)

    console.log('🐛 Inserting error reports...')
    await insertInBatches('error_reports', errorReports, batchSize)

    console.log('📱 Inserting user devices...')
    await insertInBatches('user_devices', userDevices, batchSize)

    console.log('📩 Inserting push notifications...')
    await insertInBatches('push_notifications', pushNotifications, batchSize)

    console.log('✅ Database seeding completed successfully!')
    console.log(`📊 Summary:`)
    console.log(`   - Users: ${users.length}`)
    console.log(`   - Courses: ${courses.length}`)
    console.log(`   - Enrollments: ${courseEnrollments.length}`)
    console.log(`   - Blog Posts: ${blogPosts.length}`)
    console.log(`   - Services: ${services.length}`)
    console.log(`   - Service Requests: ${serviceRequests.length}`)
    console.log(`   - Notifications: ${notifications.length}`)
    console.log(`   - Analytics Events: ${analyticsEvents.length}`)
    console.log(`   - Performance Metrics: ${performanceMetrics.length}`)
    console.log(`   - Error Reports: ${errorReports.length}`)

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

async function insertInBatches(table: string, data: any[], batchSize: number) {
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize)
    const { error } = await supabase.from(table).insert(batch)
    
    if (error) {
      console.error(`Error inserting batch for ${table}:`, error)
      throw error
    }
    
    console.log(`   Inserted ${Math.min(i + batchSize, data.length)}/${data.length} ${table}`)
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
}

export { seedDatabase }
