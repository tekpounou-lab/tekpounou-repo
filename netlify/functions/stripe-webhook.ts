import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function handler(event: any, context: any) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const sig = event.headers['stripe-signature'];
    let stripeEvent: Stripe.Event;

    try {
      stripeEvent = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    // Handle different event types
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(stripeEvent.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object as Stripe.PaymentIntent);
        break;
      case 'invoice.payment_succeeded':
        await handleSubscriptionPayment(stripeEvent.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true }),
    };
  } catch (error: any) {
    console.error('Webhook error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment succeeded:', paymentIntent.id);

  // Update transaction status
  const { data: transaction, error: transactionError } = await supabaseAdmin
    .from('transactions')
    .update({
      status: 'completed',
      processed_at: new Date().toISOString(),
    })
    .eq('payment_intent_id', paymentIntent.id)
    .select()
    .single();

  if (transactionError) {
    console.error('Error updating transaction:', transactionError);
    return;
  }

  const metadata = paymentIntent.metadata;

  if (metadata.type === 'course') {
    await handleCoursePayment(transaction);
  } else if (metadata.type === 'subscription') {
    await handleSubscriptionPayment(transaction);
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment failed:', paymentIntent.id);

  // Update transaction status
  await supabaseAdmin
    .from('transactions')
    .update({
      status: 'failed',
      processed_at: new Date().toISOString(),
    })
    .eq('payment_intent_id', paymentIntent.id);
}

async function handleCoursePayment(transaction: any) {
  try {
    // Enroll user in course
    const { error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .insert({
        student_id: transaction.user_id,
        course_id: transaction.course_id,
        enrolled_at: new Date().toISOString(),
      });

    if (enrollmentError) {
      console.error('Error creating enrollment:', enrollmentError);
      return;
    }

    // Get platform commission rate
    const { data: commissionSetting } = await supabaseAdmin
      .from('platform_settings')
      .select('value')
      .eq('key', 'platform_commission_rate')
      .single();

    const commissionRate = commissionSetting?.value || 30;
    const platformFee = (transaction.amount * commissionRate) / 100;
    const teacherEarning = transaction.amount - platformFee;

    // Create teacher earnings record
    const { error: earningsError } = await supabaseAdmin
      .from('teacher_earnings')
      .insert({
        teacher_id: transaction.metadata.teacher_id,
        transaction_id: transaction.id,
        course_id: transaction.course_id,
        gross_amount: transaction.amount,
        platform_fee: platformFee,
        net_amount: teacherEarning,
        commission_rate: commissionRate,
        status: 'available',
      });

    if (earningsError) {
      console.error('Error creating teacher earnings:', earningsError);
    }

    // Create notification for student
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: transaction.user_id,
        type: 'course_purchased',
        title: 'Course Purchase Successful',
        content: `You now have access to "${transaction.metadata.course_title}"`,
        data: {
          course_id: transaction.course_id,
          transaction_id: transaction.id,
        },
      });

    console.log('Course payment processed successfully');
  } catch (error) {
    console.error('Error processing course payment:', error);
  }
}

async function handleSubscriptionPayment(transaction: any) {
  try {
    // Get plan details
    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('id', transaction.metadata.plan_id)
      .single();

    if (!plan) {
      console.error('Plan not found');
      return;
    }

    // Calculate end date based on billing cycle
    let endDate: string | null = null;
    let renewalDate: string | null = null;

    if (plan.billing_cycle !== 'lifetime') {
      const now = new Date();
      if (plan.billing_cycle === 'monthly') {
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
        renewalDate = endDate;
      } else if (plan.billing_cycle === 'yearly') {
        endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString();
        renewalDate = endDate;
      }
    }

    // Create or update subscription
    const { error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert({
        user_id: transaction.user_id,
        plan_id: transaction.metadata.plan_id,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: endDate,
        renewal_date: renewalDate,
      });

    if (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError);
      return;
    }

    // Create notification for user
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: transaction.user_id,
        type: 'subscription_activated',
        title: 'Subscription Activated',
        content: `Your ${plan.name} subscription is now active!`,
        data: {
          plan_id: plan.id,
          transaction_id: transaction.id,
        },
      });

    console.log('Subscription payment processed successfully');
  } catch (error) {
    console.error('Error processing subscription payment:', error);
  }
}
