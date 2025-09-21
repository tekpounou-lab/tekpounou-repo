// Environment variables with defaults
export const env = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key',
  APP_NAME: import.meta.env.VITE_APP_NAME || 'Tek Pou Nou',
  DEFAULT_LANGUAGE: import.meta.env.VITE_DEFAULT_LANGUAGE || 'ht-HT',
  SUPER_ADMIN_EMAIL: import.meta.env.VITE_SUPER_ADMIN_EMAIL || 'admin@tekpounou.com',
} as const;

// Validate required environment variables
export const validateEnv = () => {
  const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'] as const;
  const missing = required.filter((key) => !env[key] || env[key].includes('placeholder') || env[key].includes('your_'));
  
  if (missing.length > 0) {
    console.warn(
      `Missing or invalid environment variables: ${missing.join(', ')}. Please update your .env.local file with valid Supabase credentials.`
    );
    return false;
  }
  return true;
};

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register', 
    LOGOUT: '/api/auth/logout',
    PROFILE: '/api/auth/profile',
  },
  // Admin APIs
  ADMIN: {
    USERS: '/api/admin/users',
    COURSES: '/api/admin/courses',
    BLOG: '/api/admin/blog',
    SERVICES: '/api/admin/services',
    ANALYTICS: '/api/admin/analytics',
  },
  // Public APIs
  COURSES: '/api/courses',
  BLOG: '/api/blog',
  SERVICES: '/api/services',
} as const;