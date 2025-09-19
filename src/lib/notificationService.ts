import { supabase } from '@/lib/supabase';
import { NotificationType, NotificationPriority } from '@/types';

interface NotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  linkUrl?: string;
  metadata?: Record<string, any>;
  priority?: NotificationPriority;
  sendEmail?: boolean;
  emailData?: {
    subject?: string;
    html?: string;
    text?: string;
  };
}

class NotificationService {
  /**
   * Send a notification to a user
   */
  async sendNotification(data: NotificationData) {
    try {
      const { data: result, error } = await supabase.functions.invoke('notifications', {
        body: { action: 'send_notification', ...data }
      });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Course-related notification triggers
   */
  async notifyCourseEnrollment(userId: string, courseTitle: string, courseId: string) {
    return this.sendNotification({
      userId,
      type: 'course',
      title: `Welcome to ${courseTitle}!`,
      body: `You have successfully enrolled in ${courseTitle}. Start learning now!`,
      linkUrl: `/courses/${courseId}`,
      priority: 'normal',
      sendEmail: true,
      metadata: { courseId, event: 'enrollment_confirmed' }
    });
  }

  async notifyNewLesson(userId: string, courseTitle: string, lessonTitle: string, courseId: string, lessonId: string) {
    return this.sendNotification({
      userId,
      type: 'course',
      title: `New lesson available: ${lessonTitle}`,
      body: `A new lesson "${lessonTitle}" is now available in ${courseTitle}.`,
      linkUrl: `/courses/${courseId}/lessons/${lessonId}`,
      priority: 'normal',
      sendEmail: true,
      metadata: { courseId, lessonId, event: 'new_lesson' }
    });
  }

  async notifyQuizGraded(userId: string, quizTitle: string, score: number, courseId: string, quizId: string) {
    return this.sendNotification({
      userId,
      type: 'course',
      title: `Quiz Results: ${quizTitle}`,
      body: `Your quiz "${quizTitle}" has been graded. Score: ${score}%`,
      linkUrl: `/courses/${courseId}/quizzes/${quizId}/results`,
      priority: score >= 80 ? 'normal' : 'high',
      sendEmail: true,
      metadata: { courseId, quizId, score, event: 'quiz_graded' }
    });
  }

  async notifyCertificateIssued(userId: string, courseTitle: string, certificateId: string) {
    return this.sendNotification({
      userId,
      type: 'course',
      title: 'Congratulations! Certificate Earned',
      body: `You have earned a certificate for completing ${courseTitle}!`,
      linkUrl: `/certificates/${certificateId}`,
      priority: 'high',
      sendEmail: true,
      metadata: { courseTitle, certificateId, event: 'certificate_issued' }
    });
  }

  /**
   * Community-related notification triggers
   */
  async notifyNewGroupMember(userId: string, groupName: string, memberName: string, groupId: string) {
    return this.sendNotification({
      userId,
      type: 'community',
      title: `New member joined ${groupName}`,
      body: `${memberName} has joined the group ${groupName}.`,
      linkUrl: `/groups/${groupId}`,
      priority: 'normal',
      sendEmail: false,
      metadata: { groupId, memberName, event: 'new_group_member' }
    });
  }

  async notifyEventReminder(userId: string, eventTitle: string, timeUntil: string, eventId: string) {
    return this.sendNotification({
      userId,
      type: 'event',
      title: `Event Reminder: ${eventTitle}`,
      body: `Your registered event "${eventTitle}" starts ${timeUntil}.`,
      linkUrl: `/events/${eventId}`,
      priority: 'high',
      sendEmail: true,
      metadata: { eventId, timeUntil, event: 'event_reminder' }
    });
  }

  async notifyConnectionRequest(userId: string, requesterName: string, requesterId: string) {
    return this.sendNotification({
      userId,
      type: 'community',
      title: 'New connection request',
      body: `${requesterName} wants to connect with you on Tech Pou Nou.`,
      linkUrl: '/networking',
      priority: 'normal',
      sendEmail: false,
      metadata: { requesterId, requesterName, event: 'connection_request' }
    });
  }

  /**
   * Payment-related notification triggers
   */
  async notifySubscriptionRenewed(userId: string, planName: string, nextBillingDate: string) {
    return this.sendNotification({
      userId,
      type: 'payment',
      title: 'Subscription Renewed',
      body: `Your ${planName} subscription has been successfully renewed. Next billing: ${nextBillingDate}.`,
      linkUrl: '/dashboard/billing',
      priority: 'normal',
      sendEmail: true,
      metadata: { planName, nextBillingDate, event: 'subscription_renewed' }
    });
  }

  async notifyPaymentFailed(userId: string, planName: string, amount: number) {
    return this.sendNotification({
      userId,
      type: 'payment',
      title: 'Payment Failed',
      body: `We couldn't process your payment of $${amount} for ${planName}. Please update your payment method.`,
      linkUrl: '/dashboard/billing',
      priority: 'urgent',
      sendEmail: true,
      metadata: { planName, amount, event: 'payment_failed' }
    });
  }

  async notifyPayoutAvailable(userId: string, amount: number) {
    return this.sendNotification({
      userId,
      type: 'payment',
      title: 'Payout Available',
      body: `Your instructor payout of $${amount} is ready for withdrawal.`,
      linkUrl: '/instructor/payouts',
      priority: 'normal',
      sendEmail: true,
      metadata: { amount, event: 'payout_available' }
    });
  }

  /**
   * System-related notification triggers
   */
  async notifyPlatformUpdate(userId: string, updateTitle: string, updateDescription: string) {
    return this.sendNotification({
      userId,
      type: 'system',
      title: updateTitle,
      body: updateDescription,
      linkUrl: '/updates',
      priority: 'normal',
      sendEmail: false,
      metadata: { event: 'platform_update' }
    });
  }

  async notifyMaintenanceNotice(userId: string, date: string, startTime: string, endTime: string) {
    return this.sendNotification({
      userId,
      type: 'system',
      title: 'Scheduled Maintenance',
      body: `Tech Pou Nou will undergo maintenance on ${date} from ${startTime} to ${endTime}.`,
      priority: 'high',
      sendEmail: true,
      metadata: { date, startTime, endTime, event: 'maintenance_notice' }
    });
  }

  /**
   * Message-related notification triggers
   */
  async notifyNewPrivateMessage(userId: string, senderName: string, conversationId: string) {
    return this.sendNotification({
      userId,
      type: 'message',
      title: `New Message from ${senderName}`,
      body: `You have received a new message from ${senderName}.`,
      linkUrl: `/messages/${conversationId}`,
      priority: 'normal',
      sendEmail: false,
      metadata: { senderName, conversationId, event: 'new_private_message' }
    });
  }

  /**
   * Bulk notification triggers
   */
  async sendGlobalAnnouncement(title: string, body: string, linkUrl?: string, userFilter?: { role?: string; subscription_status?: string }, sendEmail: boolean = false) {
    try {
      const { data, error } = await supabase.functions.invoke('notifications', {
        body: { 
          action: 'send_bulk_announcement', 
          title, 
          body, 
          linkUrl, 
          userFilter, 
          sendEmail 
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to send global announcement:', error);
      throw error;
    }
  }

  /**
   * Email queue processing (for admin use)
   */
  async processEmailQueue() {
    try {
      const { data, error } = await supabase.functions.invoke('notifications', {
        body: { action: 'process_email_queue' }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to process email queue:', error);
      throw error;
    }
  }

  /**
   * Helper method to interpolate template variables
   */
  private interpolateTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || match;
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export individual trigger functions for convenience
export const {
  notifyCourseEnrollment,
  notifyNewLesson,
  notifyQuizGraded,
  notifyCertificateIssued,
  notifyNewGroupMember,
  notifyEventReminder,
  notifyConnectionRequest,
  notifySubscriptionRenewed,
  notifyPaymentFailed,
  notifyPayoutAvailable,
  notifyPlatformUpdate,
  notifyMaintenanceNotice,
  notifyNewPrivateMessage,
  sendGlobalAnnouncement
} = notificationService;

export default notificationService;