import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  templateId?: string
  templateData?: Record<string, any>
}

interface NotificationPayload {
  userId: string
  type: string
  title: string
  body: string
  linkUrl?: string
  metadata?: Record<string, any>
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  sendEmail?: boolean
  emailData?: Partial<EmailData>
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...payload } = await req.json()

    switch (action) {
      case 'send_notification':
        return await handleSendNotification(supabaseClient, payload as NotificationPayload)
      case 'process_email_queue':
        return await handleProcessEmailQueue(supabaseClient)
      case 'send_bulk_announcement':
        return await handleBulkAnnouncement(supabaseClient, payload)
      default:
        throw new Error(`Unknown action: ${action}`)
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function handleSendNotification(supabaseClient: any, payload: NotificationPayload) {
  const { userId, type, title, body, linkUrl, metadata = {}, priority = 'normal', sendEmail = false, emailData = {} } = payload

  // Get user notification settings
  const { data: settings } = await supabaseClient
    .from('user_notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!settings) {
    throw new Error('User notification settings not found')
  }

  // Check if user has in-app notifications enabled for this type
  const inAppEnabled = getNotificationEnabled(settings, type, 'inapp')
  const emailEnabled = getNotificationEnabled(settings, type, 'email') && sendEmail

  let notificationId = null

  // Create in-app notification if enabled
  if (inAppEnabled) {
    const { data: notification, error } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        body,
        link_url: linkUrl,
        metadata,
        priority
      })
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`)
    }

    notificationId = notification.id
  }

  // Queue email if enabled
  if (emailEnabled) {
    await queueEmail(supabaseClient, userId, notificationId, type, title, body, linkUrl, emailData)
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      notificationId,
      emailQueued: emailEnabled 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleProcessEmailQueue(supabaseClient: any) {
  // Get pending emails
  const { data: emails, error } = await supabaseClient
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .lt('attempts', 3)
    .limit(50)

  if (error) {
    throw new Error(`Failed to fetch email queue: ${error.message}`)
  }

  const results = []

  for (const email of emails) {
    try {
      // Mark as sending
      await supabaseClient
        .from('email_queue')
        .update({ status: 'sending', attempts: email.attempts + 1 })
        .eq('id', email.id)

      // Send email using Resend or SendGrid
      await sendEmail({
        to: email.to_email,
        from: email.from_email,
        replyTo: email.reply_to,
        subject: email.subject,
        html: email.body_html,
        text: email.body_text
      })

      // Mark as sent
      await supabaseClient
        .from('email_queue')
        .update({ 
          status: 'sent', 
          sent_at: new Date().toISOString() 
        })
        .eq('id', email.id)

      results.push({ id: email.id, status: 'sent' })
    } catch (error) {
      console.error(`Failed to send email ${email.id}:`, error)
      
      // Mark as failed or retry
      const status = email.attempts >= 2 ? 'failed' : 'pending'
      await supabaseClient
        .from('email_queue')
        .update({ 
          status,
          error_message: error.message,
          failed_at: status === 'failed' ? new Date().toISOString() : null
        })
        .eq('id', email.id)

      results.push({ id: email.id, status: 'failed', error: error.message })
    }
  }

  return new Response(
    JSON.stringify({ success: true, processed: results.length, results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleBulkAnnouncement(supabaseClient: any, payload: any) {
  const { title, body, linkUrl, userFilter = {}, sendEmail = false } = payload

  // Get target users based on filter
  let query = supabaseClient.from('profiles').select('id, email')
  
  if (userFilter.role) {
    query = query.eq('role', userFilter.role)
  }
  if (userFilter.subscription_status) {
    query = query.eq('subscription_status', userFilter.subscription_status)
  }

  const { data: users, error } = await query

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`)
  }

  const notifications = users.map(user => ({
    user_id: user.id,
    type: 'announcement',
    title,
    body,
    link_url: linkUrl,
    priority: 'high'
  }))

  // Batch insert notifications
  const { error: notifError } = await supabaseClient
    .from('notifications')
    .insert(notifications)

  if (notifError) {
    throw new Error(`Failed to create announcements: ${notifError.message}`)
  }

  // Queue emails if requested
  if (sendEmail) {
    const emails = users.map(user => ({
      user_id: user.id,
      to_email: user.email,
      subject: `${title} - Tech Pou Nou`,
      body_html: generateEmailHTML(title, body, linkUrl),
      body_text: `${title}\n\n${body}${linkUrl ? `\n\nLearn more: ${linkUrl}` : ''}`,
      status: 'pending'
    }))

    await supabaseClient
      .from('email_queue')
      .insert(emails)
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      notificationsSent: users.length,
      emailsQueued: sendEmail ? users.length : 0
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function getNotificationEnabled(settings: any, type: string, channel: 'email' | 'inapp' | 'push'): boolean {
  if (!settings[`${channel}_enabled`]) return false

  const typeKey = `${channel}_${type}_updates`
  return settings[typeKey] !== false // Default to true if not specified
}

async function queueEmail(
  supabaseClient: any, 
  userId: string, 
  notificationId: string | null, 
  type: string, 
  title: string, 
  body: string, 
  linkUrl?: string,
  emailData: Partial<EmailData> = {}
) {
  // Get user email
  const { data: profile } = await supabaseClient
    .from('profiles')
    .select('email, first_name, last_name')
    .eq('id', userId)
    .single()

  if (!profile?.email) {
    throw new Error('User email not found')
  }

  const emailSubject = emailData.subject || `${title} - Tech Pou Nou`
  const emailHTML = emailData.html || generateEmailHTML(title, body, linkUrl, profile.first_name)
  const emailText = emailData.text || `${title}\n\n${body}${linkUrl ? `\n\nLearn more: ${linkUrl}` : ''}`

  await supabaseClient
    .from('email_queue')
    .insert({
      user_id: userId,
      notification_id: notificationId,
      to_email: profile.email,
      subject: emailSubject,
      body_html: emailHTML,
      body_text: emailText,
      status: 'pending'
    })
}

async function sendEmail(emailData: EmailData) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const sendgridApiKey = Deno.env.get('SENDGRID_API_KEY')

  if (resendApiKey) {
    return await sendWithResend(emailData, resendApiKey)
  } else if (sendgridApiKey) {
    return await sendWithSendGrid(emailData, sendgridApiKey)
  } else {
    throw new Error('No email service API key configured')
  }
}

async function sendWithResend(emailData: EmailData, apiKey: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: emailData.from || 'Tech Pou Nou <noreply@techpounou.com>',
      to: [emailData.to],
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      reply_to: emailData.replyTo
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Resend API error: ${error}`)
  }

  return await response.json()
}

async function sendWithSendGrid(emailData: EmailData, apiKey: string) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email: emailData.to }],
        subject: emailData.subject
      }],
      from: { 
        email: emailData.from?.includes('<') 
          ? emailData.from.match(/<(.+)>/)?.[1] || 'noreply@techpounou.com'
          : emailData.from || 'noreply@techpounou.com',
        name: 'Tech Pou Nou'
      },
      content: [
        {
          type: 'text/html',
          value: emailData.html
        },
        ...(emailData.text ? [{
          type: 'text/plain',
          value: emailData.text
        }] : [])
      ],
      reply_to: emailData.replyTo ? { email: emailData.replyTo } : undefined
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`SendGrid API error: ${error}`)
  }

  return { success: true }
}

function generateEmailHTML(title: string, body: string, linkUrl?: string, firstName?: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .content { padding: 30px; }
        .title { color: #333; font-size: 24px; margin-bottom: 20px; }
        .body { color: #666; line-height: 1.6; margin-bottom: 30px; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .social-links { margin: 15px 0; }
        .social-links a { margin: 0 10px; color: #667eea; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🎓 Tech Pou Nou</div>
            <div>Empowering Haiti through Technology Education</div>
        </div>
        <div class="content">
            ${firstName ? `<p>Hello ${firstName},</p>` : '<p>Hello,</p>'}
            <h1 class="title">${title}</h1>
            <div class="body">${body}</div>
            ${linkUrl ? `<a href="${linkUrl}" class="cta-button">Learn More</a>` : ''}
        </div>
        <div class="footer">
            <div class="social-links">
                <a href="https://facebook.com/techpounou">Facebook</a>
                <a href="https://twitter.com/techpounou">Twitter</a>
                <a href="https://linkedin.com/company/techpounou">LinkedIn</a>
            </div>
            <p>© 2024 Tech Pou Nou. All rights reserved.</p>
            <p>Empowering Haiti through Technology Education</p>
            <p><a href="{{unsubscribe_url}}" style="color: #666;">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>
  `
}