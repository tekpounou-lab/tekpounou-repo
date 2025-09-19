import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailProvider {
  sendEmail(to: string, subject: string, content: string, htmlContent?: string): Promise<boolean>
}

class ResendProvider implements EmailProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async sendEmail(to: string, subject: string, content: string, htmlContent?: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Tek Pou Nou <no-reply@tekpounou.com>',
          to: [to],
          subject: subject,
          text: content,
          html: htmlContent || content,
        }),
      })

      return response.ok
    } catch (error) {
      console.error('Resend email error:', error)
      return false
    }
  }
}

class SendGridProvider implements EmailProvider {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async sendEmail(to: string, subject: string, content: string, htmlContent?: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: 'no-reply@tekpounou.com', name: 'Tek Pou Nou' },
          subject: subject,
          content: [
            { type: 'text/plain', value: content },
            ...(htmlContent ? [{ type: 'text/html', value: htmlContent }] : [])
          ],
        }),
      })

      return response.ok
    } catch (error) {
      console.error('SendGrid email error:', error)
      return false
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, ...payload } = await req.json()

    switch (action) {
      case 'subscribe_newsletter':
        return await subscribeNewsletter(supabaseClient, payload)
      
      case 'unsubscribe_newsletter':
        return await unsubscribeNewsletter(supabaseClient, payload)
      
      case 'send_campaign':
        return await sendCampaign(supabaseClient, payload)
      
      case 'send_welcome_email':
        return await sendWelcomeEmail(supabaseClient, payload)
      
      case 'create_referral':
        return await createReferral(supabaseClient, payload)
      
      case 'track_referral_click':
        return await trackReferralClick(supabaseClient, payload)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function subscribeNewsletter(supabase: any, payload: any) {
  const { email, name, source, userId, metadata } = payload

  // Check if already subscribed
  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .eq('email', email)
    .single()

  if (existing) {
    if (existing.status === 'active') {
      return new Response(
        JSON.stringify({ message: 'Already subscribed', subscriberId: existing.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      // Reactivate subscription
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .update({ 
          status: 'active', 
          subscribed_at: new Date().toISOString(),
          unsubscribed_at: null,
          name: name || existing.name,
          source: source || existing.source,
          metadata: { ...existing.metadata, ...metadata }
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error

      return new Response(
        JSON.stringify({ message: 'Subscription reactivated', subscriber: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  }

  // Create new subscription
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .insert([{
      email,
      name,
      user_id: userId,
      source: source || 'website',
      metadata: metadata || {}
    }])
    .select()
    .single()

  if (error) throw error

  // Track growth metric
  await supabase.rpc('track_growth_metric', {
    p_metric_type: 'newsletter_signup',
    p_user_id: userId,
    p_source: source || 'website'
  })

  // Send welcome email
  try {
    await sendWelcomeEmail(supabase, { email, name })
  } catch (emailError) {
    console.error('Failed to send welcome email:', emailError)
    // Don't fail the subscription if email fails
  }

  return new Response(
    JSON.stringify({ message: 'Subscribed successfully', subscriber: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function unsubscribeNewsletter(supabase: any, payload: any) {
  const { email, token } = payload

  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .update({ 
      status: 'unsubscribed',
      unsubscribed_at: new Date().toISOString()
    })
    .eq('email', email)
    .select()
    .single()

  if (error) throw error

  return new Response(
    JSON.stringify({ message: 'Unsubscribed successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function sendWelcomeEmail(supabase: any, payload: any) {
  const { email, name } = payload
  
  const emailProvider = getEmailProvider()
  
  const subject = 'Byenveni nan Tek Pou Nou! 🎉'
  const content = `
Bonjou ${name || ''},

Mèsi anpil pou ou abonnen nan newsletter Tek Pou Nou! Nou kontan anpil pou nou gen ou nan kominote nou an.

Kisa ou ka atann:
• Nouvo kou ak resous yo
• Konsèy ak estrateji pou teknoloji
• Aktyalite sou pwogram yo ak sètifika yo
• Òpòtinite travay ak patone yo

Rete konekte ak nou:
📧 Newsletter chak semèn
🌐 Vizite platfòm nou an: https://tekpounou.com
📱 Suiv nou sou rezo sosyal yo

Ak gwo kè,
Equipe Tek Pou Nou

---

Hello ${name || ''},

Thank you so much for subscribing to the Tek Pou Nou newsletter! We're thrilled to have you in our community.

What you can expect:
• New courses and resources
• Technology tips and strategies  
• Updates on programs and certifications
• Job opportunities and partnerships

Stay connected:
📧 Weekly newsletter
🌐 Visit our platform: https://tekpounou.com
📱 Follow us on social media

Best regards,
The Tek Pou Nou Team
  `

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; }
        .btn { background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Byenveni nan Tek Pou Nou! 🎉</h1>
    </div>
    <div class="content">
        <p>Bonjou ${name || ''},</p>
        <p>Mèsi anpil pou ou abonnen nan newsletter Tek Pou Nou! Nou kontan anpil pou nou gen ou nan kominote nou an.</p>
        
        <h3>Kisa ou ka atann:</h3>
        <ul>
            <li>📚 Nouvo kou ak resous yo</li>
            <li>💡 Konsèy ak estrateji pou teknoloji</li>
            <li>🎓 Aktyalite sou pwogram yo ak sètifika yo</li>
            <li>💼 Òpòtinite travay ak patone yo</li>
        </ul>
        
        <p><a href="https://tekpounou.com" class="btn">Explore Platfòm nan</a></p>
        
        <p>Ak gwo kè,<br>Equipe Tek Pou Nou</p>
        
        <hr>
        
        <p><strong>Hello ${name || ''},</strong></p>
        <p>Thank you so much for subscribing to the Tek Pou Nou newsletter! We're thrilled to have you in our community.</p>
        
        <h3>What you can expect:</h3>
        <ul>
            <li>📚 New courses and resources</li>
            <li>💡 Technology tips and strategies</li>
            <li>🎓 Updates on programs and certifications</li>
            <li>💼 Job opportunities and partnerships</li>
        </ul>
        
        <p>Best regards,<br>The Tek Pou Nou Team</p>
    </div>
    <div class="footer">
        <p>Tek Pou Nou - Technology for Us | <a href="https://tekpounou.com">tekpounou.com</a></p>
        <p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>
    </div>
</body>
</html>
  `

  const success = await emailProvider.sendEmail(email, subject, content, htmlContent)
  
  return new Response(
    JSON.stringify({ message: success ? 'Welcome email sent' : 'Failed to send welcome email' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function sendCampaign(supabase: any, payload: any) {
  const { campaignId } = payload

  // Get campaign details
  const { data: campaign, error: campaignError } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single()

  if (campaignError) throw campaignError

  // Get subscribers based on campaign tags/filters
  let query = supabase
    .from('newsletter_subscribers')
    .select('*')
    .eq('status', 'active')

  if (campaign.tags && campaign.tags.length > 0) {
    query = query.overlaps('tags', campaign.tags)
  }

  const { data: subscribers, error: subscribersError } = await query

  if (subscribersError) throw subscribersError

  const emailProvider = getEmailProvider()
  let sentCount = 0
  let failedCount = 0

  // Send emails and track recipients
  for (const subscriber of subscribers) {
    try {
      // Create recipient record
      await supabase
        .from('email_campaign_recipients')
        .insert({
          campaign_id: campaignId,
          subscriber_id: subscriber.id,
          status: 'pending'
        })

      // Send email
      const success = await emailProvider.sendEmail(
        subscriber.email,
        campaign.subject,
        campaign.content,
        campaign.html_content
      )

      // Update recipient status
      await supabase
        .from('email_campaign_recipients')
        .update({
          status: success ? 'sent' : 'failed',
          sent_at: success ? new Date().toISOString() : null
        })
        .eq('campaign_id', campaignId)
        .eq('subscriber_id', subscriber.id)

      if (success) {
        sentCount++
      } else {
        failedCount++
      }

      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    } catch (error) {
      failedCount++
      console.error(`Failed to send to ${subscriber.email}:`, error)
    }
  }

  // Update campaign stats
  await supabase
    .from('email_campaigns')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      recipient_count: sentCount + failedCount
    })
    .eq('id', campaignId)

  return new Response(
    JSON.stringify({ 
      message: 'Campaign sent',
      sentCount,
      failedCount,
      totalRecipients: subscribers.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function createReferral(supabase: any, payload: any) {
  const { referrerId, refereeEmail, rewardType = 'discount', rewardValue = 10 } = payload

  const referralCode = await generateReferralCode(referrerId)

  const { data, error } = await supabase
    .from('referrals')
    .insert([{
      referrer_id: referrerId,
      referee_email: refereeEmail,
      referral_code: referralCode,
      reward_type: rewardType,
      reward_value: rewardValue,
      reward_description: `${rewardValue}% discount on next purchase`,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    }])
    .select()
    .single()

  if (error) throw error

  // Track referral creation
  await supabase.rpc('track_growth_metric', {
    p_metric_type: 'referral_created',
    p_user_id: referrerId,
    p_related_id: data.id,
    p_related_type: 'referral'
  })

  return new Response(
    JSON.stringify({ message: 'Referral created successfully', referral: data }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function trackReferralClick(supabase: any, payload: any) {
  const { referralCode, metadata } = payload

  // Track referral click
  await supabase.rpc('track_growth_metric', {
    p_metric_type: 'referral_click',
    p_source: 'referral',
    p_utm_source: 'referral',
    p_utm_campaign: referralCode
  })

  return new Response(
    JSON.stringify({ message: 'Referral click tracked' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function getEmailProvider(): EmailProvider {
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY')

  if (resendApiKey) {
    return new ResendProvider(resendApiKey)
  } else if (sendGridApiKey) {
    return new SendGridProvider(sendGridApiKey)
  } else {
    throw new Error('No email provider configured. Please set RESEND_API_KEY or SENDGRID_API_KEY.')
  }
}

async function generateReferralCode(userId: string): Promise<string> {
  const timestamp = Date.now().toString()
  const combined = userId + timestamp
  const encoder = new TextEncoder()
  const data = encoder.encode(combined)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex.substring(0, 8).toUpperCase()
}
