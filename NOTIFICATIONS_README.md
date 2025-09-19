# 🔔 Unified Notifications System

A comprehensive notification system for Tech Pou Nou that supports in-app notifications, email delivery, and is ready for future push notifications.

## ✨ Features

### 📱 Multi-Channel Delivery
- **In-App Notifications**: Real-time notifications with dropdown bell
- **Email Notifications**: Branded email templates with SendGrid/Resend
- **Push Ready**: Structure prepared for mobile push notifications

### 🎯 Notification Types
- **Course**: Enrollment, new lessons, quiz results, certificates
- **Community**: Event reminders, group activities, connections
- **Payment**: Subscription renewals, payment failures, payouts
- **System**: Platform updates, maintenance notices
- **Messages**: Private messages, discussions
- **Announcements**: Global platform announcements

### 🛡️ Advanced Features
- **Priority Levels**: Low, Normal, High, Urgent
- **User Preferences**: Granular control over notification channels
- **Quiet Hours**: Respect user sleep/work schedules
- **Template System**: Consistent messaging with interpolation
- **Email Queue**: Reliable delivery with retry logic
- **Real-time Updates**: Live notification updates via Supabase subscriptions

## 📁 File Structure

```
src/
├── components/
│   ├── notifications/
│   │   ├── NotificationBell.tsx         # Header notification bell with dropdown
│   │   └── NotificationSettings.tsx     # User notification preferences
│   └── admin/
│       └── SuperAdminNotifications.tsx  # Admin notification management
├── pages/
│   └── dashboard/
│       ├── NotificationsPage.tsx        # Full notification history
│       └── DashboardSettingsPage.tsx    # Settings page with notifications tab
├── hooks/
│   └── useNotifications.ts              # Notification management hook
├── lib/
│   └── notificationService.ts           # Service for triggering notifications
├── types/
│   └── index.ts                         # TypeScript definitions
└── supabase/
    ├── migrations/
    │   └── 20241003000000_add_notifications_system.sql
    └── functions/
        └── notifications/
            └── index.ts                 # Edge function for email processing
```

## 🗄️ Database Schema

### Core Tables

#### `notifications`
- Stores all user notifications
- Supports metadata, priority, expiration
- Tracks read status and timestamps

#### `user_notification_settings` 
- User preferences for each channel (email, in-app, push)
- Granular control by notification type
- Quiet hours and digest frequency

#### `notification_templates`
- Consistent messaging templates
- Email and in-app variants
- Variable interpolation support

#### `email_queue`
- Reliable email delivery
- Retry logic and error tracking
- Support for both transactional and template emails

## 🚀 Usage Examples

### Triggering Notifications

```typescript
import { notificationService } from '@/lib/notificationService';

// Course enrollment notification
await notificationService.notifyCourseEnrollment(
  userId,
  'Introduction to React',
  courseId
);

// Event reminder
await notificationService.notifyEventReminder(
  userId,
  'JavaScript Workshop',
  'in 1 hour',
  eventId
);

// Payment failure (urgent)
await notificationService.notifyPaymentFailed(
  userId,
  'Premium Plan',
  29.99
);

// Global announcement
await notificationService.sendGlobalAnnouncement(
  'Platform Maintenance',
  'Scheduled maintenance tonight from 2-4 AM EST',
  '/updates',
  { role: 'student' }, // Filter by role
  true // Send email
);
```

### Using the Hook

```typescript
import { useNotifications } from '@/hooks/useNotifications';

function MyComponent() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    updateSettings,
    subscribeToNotifications
  } = useNotifications();

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToNotifications();
    return unsubscribe;
  }, []);

  return (
    <div>
      <span>You have {unreadCount} unread notifications</span>
      {/* Component content */}
    </div>
  );
}
```

## 🎨 Components

### NotificationBell
- Displays unread count badge
- Dropdown with recent notifications
- Real-time updates via websockets
- Archive and mark as read actions

### NotificationsPage
- Full notification history
- Advanced filtering and search
- Bulk actions (mark read, archive)
- Priority-based visual indicators

### NotificationSettings
- Channel preferences (email, in-app, push)
- Type-specific controls
- Quiet hours configuration
- Language and timezone settings

### SuperAdminNotifications
- Global announcement broadcasting
- Quick individual notifications
- Template management
- Email queue monitoring

## 📧 Email Integration

### Supported Providers
- **Resend** (recommended for modern apps)
- **SendGrid** (enterprise-grade)

### Email Features
- Branded HTML templates with Tech Pou Nou styling
- Fallback text versions
- Unsubscribe links
- Template variables
- Reliable delivery queue

### Environment Variables
```bash
# Choose one email provider
RESEND_API_KEY=your_resend_key
# OR
SENDGRID_API_KEY=your_sendgrid_key
```

## 🔧 Configuration

### Supabase Edge Function
Deploy the notification function:
```bash
supabase functions deploy notifications
```

### Database Migration
Apply the schema:
```bash
supabase db push
```

### Email Provider Setup

#### Resend Setup
1. Sign up at resend.com
2. Add your domain
3. Get API key
4. Set `RESEND_API_KEY` environment variable

#### SendGrid Setup
1. Sign up at sendgrid.com
2. Verify sender identity
3. Get API key
4. Set `SENDGRID_API_KEY` environment variable

## 🎯 Notification Triggers

### Automatic Triggers
- **Course Enrollment**: Welcome message with course link
- **New Lesson**: Notification when instructor adds content
- **Quiz Completion**: Results and feedback
- **Certificate Earned**: Achievement celebration
- **Payment Events**: Subscription status changes
- **Community Activity**: Group joins, event reminders

### Manual Triggers
- **Admin Announcements**: Platform-wide communications
- **Maintenance Notices**: Scheduled downtime alerts
- **Security Alerts**: Important account notifications

## 🔐 Security & Privacy

### Row Level Security (RLS)
- Users can only see their own notifications
- Admin access for management functions
- Secure template access

### Privacy Controls
- Granular notification preferences
- Easy unsubscribe mechanisms
- GDPR-compliant data handling
- Quiet hours respect

## 📊 Analytics & Monitoring

### Tracking Metrics
- Notification delivery rates
- Email open/click rates
- User engagement patterns
- Preference changes

### Admin Dashboard
- Email queue status
- Failed delivery logs
- User preference statistics
- Performance monitoring

## 🚀 Future Enhancements

### Push Notifications
The system is structured to support push notifications:
- User preferences already include push settings
- Notification metadata supports push payloads
- Easy integration with Firebase/OneSignal

### Advanced Features
- **A/B Testing**: Test different notification templates
- **Smart Timing**: ML-optimized delivery times
- **Rich Media**: Images and attachments in notifications
- **Localization**: Multi-language notification templates

## 🎉 Getting Started

1. **Apply Database Migration**
   ```bash
   supabase db push
   ```

2. **Deploy Edge Function**
   ```bash
   supabase functions deploy notifications
   ```

3. **Configure Email Provider**
   Set either `RESEND_API_KEY` or `SENDGRID_API_KEY`

4. **Test the System**
   - Visit `/admin/notifications` (as super admin)
   - Send a test announcement
   - Check notification bell in header

5. **Integrate Triggers**
   Add notification triggers throughout your app using `notificationService`

## 📝 Notes

- Notifications are sent asynchronously to avoid blocking user actions
- Email delivery failures are logged and retried automatically
- User preferences are respected across all notification channels
- The system scales horizontally with Supabase infrastructure

The notification system is now fully integrated and ready for production use! 🎊