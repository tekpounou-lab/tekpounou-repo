// Base types for the application

export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'student' | 'guest';
export type LanguageCode = 'ht-HT' | 'en-US' | 'fr-FR';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

// User related types
export interface User {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface Profile {
  id: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  roles: UserRole[];
  preferred_language: LanguageCode;
  created_at: string;
  updated_at: string;
}

// Teacher application
export interface TeacherApplication {
  id: string;
  user_id: string;
  application_text: string;
  qualifications: string[];
  experience_years?: number;
  subject_areas: string[];
  status: ApplicationStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

// Course related types
export interface Course {
  id: string;
  title: string;
  description?: string;
  instructor_id: string;
  thumbnail_url?: string;
  is_published: boolean;
  is_approved: boolean;
  price: number;
  language: LanguageCode;
  duration_hours?: number;
  difficulty_level?: string;
  category?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  instructor?: Profile;
}

export interface CourseEnrollment {
  id: string;
  course_id: string;
  user_id: string;
  enrolled_at: string;
  completed_at?: string;
  progress_percentage: number;
  course?: Course;
}

// Blog related types
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author_id: string;
  featured_image_url?: string;
  is_published: boolean;
  is_featured: boolean;
  language: LanguageCode;
  tags: string[];
  meta_title?: string;
  meta_description?: string;
  published_at?: string;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

// Service related types
export interface Service {
  id: string;
  title: string;
  description: string;
  service_type: string;
  provider_id: string;
  price?: number;
  pricing_model?: 'fixed' | 'hourly' | 'negotiable';
  thumbnail_url?: string;
  gallery_urls: string[];
  is_active: boolean;
  is_featured: boolean;
  location?: string;
  contact_email?: string;
  contact_phone?: string;
  tags: string[];
  requirements: string[];
  deliverables: string[];
  timeline_days?: number;
  language: LanguageCode;
  created_at: string;
  updated_at: string;
  provider?: Profile;
}

// Audit log
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// API response types
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  displayName?: string;
  preferredLanguage: LanguageCode;
}

export interface ProfileForm {
  display_name?: string;
  bio?: string;
  preferred_language: LanguageCode;
}

// Analytics types
export interface PlatformStats {
  total_users: number;
  total_teachers: number;
  total_students: number;
  total_courses: number;
  published_courses: number;
  total_enrollments: number;
  total_blog_posts: number;
  published_blog_posts: number;
  total_services: number;
  active_services: number;
  pending_teacher_applications: number;
}

// UI component types
export interface SelectOption {
  value: string;
  label: string;
}

export interface TableColumn<T = any> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// Route guard types
export interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
}

// Notification types
export type NotificationType = 'system' | 'course' | 'event' | 'payment' | 'message' | 'community' | 'announcement';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link_url?: string;
  metadata?: Record<string, any>;
  is_read: boolean;
  is_archived: boolean;
  priority: NotificationPriority;
  created_at: string;
  read_at?: string;
  expires_at?: string;
  created_by?: string;
}

export interface UserNotificationSettings {
  id: string;
  user_id: string;
  // Email preferences
  email_enabled: boolean;
  email_course_updates: boolean;
  email_community_updates: boolean;
  email_payment_updates: boolean;
  email_system_updates: boolean;
  email_marketing: boolean;
  // In-app preferences
  inapp_enabled: boolean;
  inapp_course_updates: boolean;
  inapp_community_updates: boolean;
  inapp_payment_updates: boolean;
  inapp_system_updates: boolean;
  // Push preferences (for future mobile app)
  push_enabled: boolean;
  push_course_updates: boolean;
  push_community_updates: boolean;
  push_payment_updates: boolean;
  push_system_updates: boolean;
  // User preferences
  language_pref: string;
  timezone: string;
  digest_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly' | 'never';
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationTemplate {
  id: string;
  type: NotificationType;
  trigger_event: string;
  title_template: string;
  body_template: string;
  email_subject_template?: string;
  email_body_template?: string;
  link_template?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmailQueue {
  id: string;
  user_id: string;
  notification_id?: string;
  to_email: string;
  from_email: string;
  reply_to?: string;
  subject: string;
  body_html: string;
  body_text?: string;
  template_id?: string;
  template_data?: Record<string, any>;
  status: 'pending' | 'sending' | 'sent' | 'failed' | 'retrying';
  attempts: number;
  max_attempts: number;
  scheduled_for: string;
  sent_at?: string;
  failed_at?: string;
  error_message?: string;
  created_at: string;
}

// AI Assistant types
export interface AIConversation {
  id: string;
  user_id: string;
  session_id: string;
  role: 'user' | 'assistant';
  message: string;
  response?: string;
  context?: Record<string, any>;
  language: 'ht' | 'en' | 'fr';
  is_helpful?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIBehaviorTemplate {
  id: string;
  name: string;
  user_role: UserRole;
  trigger_keywords: string[];
  template_response: string;
  is_active: boolean;
  language: 'ht' | 'en' | 'fr';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AISettings {
  id: string;
  setting_key: string;
  setting_value: any;
  description?: string;
  updated_by?: string;
  updated_at: string;
}

export interface AIUserPreferences {
  id: string;
  user_id: string;
  ai_enabled: boolean;
  preferred_language: 'ht' | 'en' | 'fr';
  voice_enabled: boolean;
  quick_suggestions_enabled: boolean;
  conversation_history_enabled: boolean;
  updated_at: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isTyping?: boolean;
}

export interface AIQuickSuggestion {
  id: string;
  text: string;
  action: string;
  icon?: string;
  role?: UserRole;
}

export interface AIResponse {
  response: string;
  language: string;
  context: {
    userRole: string;
    hasRecentCourses: boolean;
    hasUpcomingEvents: boolean;
  };
}

export interface AIConversationSession {
  sessionId: string;
  messages: AIMessage[];
  isActive: boolean;
  lastActivity: string;
}

// AI Personalization Types
export interface AIPersonalization {
  id: string;
  user_id: string;
  type: 'learning_path' | 'content_recommendation' | 'teacher_insight' | 'sme_guidance' | 'course_suggestion' | 'event_recommendation';
  context: Record<string, any>;
  recommendation_json: Record<string, any>;
  confidence_score: number;
  is_active: boolean;
  user_action?: 'viewed' | 'clicked' | 'dismissed' | 'completed' | 'bookmarked';
  created_at: string;
  expires_at?: string;
  updated_at: string;
}

export interface AIFeedback {
  id: string;
  user_id: string;
  personalization_id: string;
  module: 'chat_assistant' | 'learning_path' | 'content_recommendation' | 'voice_assistant' | 'predictive_analytics' | 'summary_generation';
  rating: number;
  comment?: string;
  feedback_type: 'helpful' | 'not_helpful' | 'inappropriate' | 'incorrect' | 'excellent';
  created_at: string;
}

export interface AILearningPath {
  id: string;
  user_id: string;
  name: string;
  description: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  estimated_duration_hours: number;
  path_data: Record<string, any>;
  completion_percentage: number;
  is_ai_generated: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIContentRecommendation {
  recommendation_id: string;
  content_id: string;
  content_title: string;
  content_type: 'course' | 'blog_post' | 'event' | 'resource' | 'service' | 'project';
  recommendation_reason: string;
  relevance_score: number;
  interaction_count: number;
  created_at: string;
  viewed_at?: string;
  clicked_at?: string;
}

export interface AIAnalyticsPrediction {
  id: string;
  prediction_type: 'course_demand' | 'user_engagement' | 'completion_rate' | 'sme_project_trends' | 'event_attendance';
  target_entity_type?: 'course' | 'user' | 'event' | 'service' | 'platform';
  target_entity_id?: string;
  prediction_data: Record<string, any>;
  confidence_level: number;
  prediction_date: string;
  actual_outcome?: Record<string, any>;
  accuracy_score?: number;
  created_at: string;
  updated_at: string;
}

export interface AIVoiceInteraction {
  id: string;
  user_id: string;
  session_id: string;
  audio_url?: string;
  transcribed_text?: string;
  response_text?: string;
  response_audio_url?: string;
  language: 'ht' | 'en' | 'fr';
  duration_seconds?: number;
  created_at: string;
}

export interface AISummary {
  id: string;
  content_type: 'course_lesson' | 'blog_post' | 'event' | 'project' | 'service_description';
  content_id: string;
  original_content_hash: string;
  summary_text: string;
  summary_language: 'ht' | 'en' | 'fr';
  summary_length: 'short' | 'medium' | 'long';
  generated_by: string;
  created_at: string;
  updated_at: string;
}

export interface AIUsageAnalytics {
  id: string;
  user_id: string;
  feature_name: string;
  interaction_type: 'view' | 'click' | 'use' | 'complete' | 'dismiss' | 'rate';
  session_id?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface AITeacherInsights {
  student_performance: Array<{
    course_id: string;
    course_title: string;
    total_students: number;
    avg_progress: number;
    completion_rate: number;
  }>;
  engagement_patterns: {
    peak_activity_hours: number[];
    most_active_days: number[];
  };
  recommendations: Array<{
    type: string;
    title: string;
    suggestion: string;
  }>;
  generated_at: string;
}

export interface AISMEGuidance {
  business_opportunities: Array<{
    service_category: string;
    demand_level: number;
    avg_budget: number;
  }>;
  trending_services: Array<{
    service_title: string;
    category: string;
    recent_requests: number;
  }>;
  recommendations: Array<{
    type: string;
    title: string;
    suggestion: string;
  }>;
  generated_at: string;
}