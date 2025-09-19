# Tek Pou Nou - Complete Setup Guide

This guide will help you set up the complete Tek Pou Nou educational platform with all features including courses, blog, and admin management.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Netlify account (for deployment)

### 1. Environment Setup

Create a `.env` file in the project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Supabase Database Setup

Run the migrations in order:

```bash
# In your Supabase SQL Editor, run these files in order:
# 1. supabase/migrations/20240101000001_initial_schema.sql
# 2. supabase/migrations/20240101000002_admin_schema.sql  
# 3. supabase/migrations/20240101000003_courses_schema.sql
# 4. supabase/migrations/20240101000004_blog_schema.sql
# 5. supabase/migrations/20240101000005_seed_courses_blog.sql
```

### 4. Configure Authentication

In your Supabase dashboard:
1. Go to Authentication > Settings
2. Configure your site URL: `http://localhost:5173`
3. Add redirect URLs for production
4. Enable email confirmations (optional)

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 📚 Platform Features

### Core Features Implemented:

#### 🔐 **Authentication & Authorization**
- Email/password authentication via Supabase
- Role-based access control (super_admin, admin, teacher, student, guest)
- Profile management with avatars and bio
- Multilingual support (Haitian Creole, English, French)

#### 📖 **Course Management System**
- **Teacher Features:**
  - Create, edit, and manage courses
  - Organize content into modules and lessons
  - Track student enrollment and progress
  - Publish/unpublish courses
  - Support for video, text, and mixed content

- **Student Features:**
  - Browse and enroll in courses
  - Track learning progress
  - Complete lessons and modules
  - View certificates (planned)
  - Rate and review courses

- **Admin Features:**
  - Manage all courses across the platform
  - Approve teacher applications
  - Monitor platform usage
  - Content moderation

#### 📝 **Blog & Content Management**
- **Content Creation:**
  - Rich text blog posts with categories and tags
  - Multilingual content support
  - Featured images and media
  - Author profiles and bio sections

- **Content Organization:**
  - Categories with color coding
  - Tags for detailed classification
  - Featured posts system
  - Search and filtering capabilities

- **Reader Experience:**
  - Responsive blog layout
  - Reading time estimation
  - View counters
  - Social sharing integration
  - Related articles suggestions

#### 🛡️ **Administrative System**
- **Super Admin Dashboard:**
  - Complete platform oversight
  - User role management
  - System analytics and reporting
  - Content approval workflows

- **Teacher Application System:**
  - Students can apply to become teachers
  - Admin review and approval process
  - Automatic role upgrades
  - Application tracking

#### 🌐 **User Experience**
- **Multilingual Interface:**
  - Default: Haitian Creole
  - Secondary: English, French
  - Dynamic language switching
  - Localized content and UI

- **Responsive Design:**
  - Mobile-first approach
  - Tablet and desktop optimization
  - Touch-friendly interfaces
  - Progressive Web App capabilities

- **Accessibility:**
  - Dark/Light mode support
  - Keyboard navigation
  - Screen reader compatibility
  - High contrast support

## 🗄️ Database Schema

### Core Tables:

#### Users & Authentication
- `users` - Supabase auth users with roles
- `profiles` - Extended user profiles and preferences
- `audit_logs` - System activity tracking

#### Course Management
- `courses` - Course metadata and settings
- `course_modules` - Course content organization
- `lessons` - Individual learning units
- `enrollments` - Student-course relationships
- `lesson_progress` - Individual lesson completion tracking
- `teacher_applications` - Teacher role requests
- `course_reviews` - Student feedback and ratings

#### Blog & Content
- `blog_posts` - Article content and metadata
- `blog_categories` - Content categorization
- `blog_tags` - Detailed content tagging
- `blog_post_tags` - Many-to-many relationship
- `comments` - Reader interactions (prepared)
- `content_approval` - Moderation workflow

### Security Features:

#### Row Level Security (RLS)
- **User Data Protection:** Users can only access their own profiles and progress
- **Role-based Permissions:** Teachers manage their courses, admins have broader access
- **Content Security:** Published content is public, drafts are private
- **Admin Controls:** Super admins have full access, regular admins have limited scope

#### API Security
- **Token-based Authentication:** All API calls require valid JWT tokens
- **Role Verification:** Server-side role checking for sensitive operations
- **Input Validation:** Comprehensive data validation and sanitization
- **CORS Protection:** Properly configured cross-origin resource sharing

## 🚀 Deployment

### Netlify Deployment

1. **Connect Repository:**
   - Link your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Environment Variables:**
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

3. **Functions Setup:**
   - Netlify automatically detects functions in the `netlify/functions` directory
   - Functions handle secure server-side operations
   - API endpoints are available at `/.netlify/functions/[function-name]`

### Supabase Configuration

1. **Update Site URLs:**
   - Add your Netlify domain to allowed origins
   - Configure redirect URLs for authentication
   - Set up custom domains if needed

2. **Database Optimization:**
   - Review and optimize query performance
   - Set up database backups
   - Monitor resource usage

## 🧪 Testing

### Test Accounts

After running the seed data:
- **Super Admin:** `superadmin@tekpounou.com` / `admin123`
- **Admin:** `admin@tekpounou.com` / `admin123`

### Manual Testing Checklist

#### Authentication Flow
- [ ] User registration
- [ ] Email verification (if enabled)
- [ ] Login/logout
- [ ] Profile management
- [ ] Role-based redirections

#### Course Management
- [ ] Teacher can create courses
- [ ] Students can enroll
- [ ] Progress tracking works
- [ ] Admin can manage all courses
- [ ] Teacher applications function

#### Blog System
- [ ] Create and publish posts
- [ ] Category and tag filtering
- [ ] Search functionality
- [ ] Multilingual content display
- [ ] Comment system (when enabled)

#### Admin Functions
- [ ] User role management
- [ ] Content moderation
- [ ] Analytics display
- [ ] System monitoring

## 📋 Next Steps & Roadmap

### Immediate Enhancements
1. **Advanced Course Features:**
   - Video upload and streaming
   - Interactive quizzes and assessments
   - Completion certificates
   - Course discussions/forums

2. **Community Features:**
   - Student-teacher messaging
   - Study groups
   - Peer-to-peer learning
   - Achievement badges

3. **Content Expansion:**
   - Live streaming capabilities
   - Downloadable resources
   - Mobile app development
   - Offline content access

### Advanced Features
1. **AI Integration:**
   - Content recommendations
   - Automated content moderation
   - Learning path optimization
   - Language translation assistance

2. **Analytics & Insights:**
   - Learning analytics dashboard
   - Engagement metrics
   - Performance tracking
   - Predictive analytics

3. **Monetization:**
   - Premium course tiers
   - Subscription models
   - Certification programs
   - Corporate training packages

## 🆘 Troubleshooting

### Common Issues

1. **Supabase Connection Issues:**
   - Verify environment variables
   - Check Supabase project status
   - Confirm database migrations

2. **Authentication Problems:**
   - Check redirect URLs
   - Verify email templates
   - Review RLS policies

3. **Deployment Issues:**
   - Confirm build settings
   - Check function deployments
   - Verify environment variables

### Getting Help

- Check the browser console for error messages
- Review Supabase logs for database issues
- Inspect Netlify function logs for API problems
- Verify network requests in browser dev tools

---

## 🎯 Success Metrics

Your platform is ready when:
- [ ] Users can register and create profiles
- [ ] Teachers can create and manage courses
- [ ] Students can enroll and track progress
- [ ] Blog posts can be created and viewed
- [ ] Admin can manage users and content
- [ ] Multi-language interface works
- [ ] Dark/light mode functions
- [ ] Mobile interface is responsive

**Congratulations!** You now have a fully functional educational platform ready to serve the Haitian community and beyond. 🎉
