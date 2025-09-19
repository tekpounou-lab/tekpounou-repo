import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function handler(event: any, context: any) {
  // Handle CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
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
    // Get user from JWT token
    const authHeader = event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    const { type, course_id, plan_id } = JSON.parse(event.body);

    if (type === 'course') {
      return await createCoursePaymentIntent(user.id, course_id);
    } else if (type === 'subscription') {
      return await createSubscriptionPaymentIntent(user.id, plan_id);
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid payment type' }),
      };
    }
  } catch (error: any) {
    console.error('Payment intent creation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
}

async function createCoursePaymentIntent(userId: string, courseId: string) {
  // Get course details
  const { data: course, error: courseError } = await supabaseAdmin
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .single();

  if (courseError || !course) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Course not found' }),
    };
  }

  if (course.is_free) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Course is free' }),
    };
  }

  // Check if user already has access
  const { data: existingTransaction } = await supabaseAdmin
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('status', 'completed')
    .single();

  if (existingTransaction) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Course already purchased' }),
    };
  }

  // Create Stripe payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(course.price * 100), // Convert to cents
    currency: course.currency || 'usd',
    metadata: {
      type: 'course',
      user_id: userId,
      course_id: courseId,
    },
  });

  // Create transaction record
  const { data: transaction, error: transactionError } = await supabaseAdmin
    .from('transactions')
    .insert({
      user_id: userId,
      amount: course.price,
      currency: course.currency || 'USD',
      status: 'pending',
      payment_provider: 'stripe',
      payment_intent_id: paymentIntent.id,
      transaction_type: 'course',
      course_id: courseId,
      metadata: {
        course_title: course.title,
        teacher_id: course.teacher_id,
      },
    })
    .select()
    .single();

  if (transactionError) {
    throw new Error('Failed to create transaction record');
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      client_secret: paymentIntent.client_secret,
      transaction_id: transaction.id,
    }),
  };
}

async function createSubscriptionPaymentIntent(userId: string, planId: string) {
  // Get plan details
  const { data: plan, error: planError } = await supabaseAdmin
    .from('subscription_plans')
    .select('*')
    .eq('id', planId)
    .eq('is_active', true)
    .single();

  if (planError || !plan) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Plan not found' }),
    };
  }

  // Check for existing active subscription
  const { data: existingSubscription } = await supabaseAdmin
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .eq('plan_id', planId)
    .eq('status', 'active')
    .single();

  if (existingSubscription) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Already subscribed to this plan' }),
    };
  }

  if (plan.price === 0) {
    // Free plan - create subscription directly
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        plan_id: planId,
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: plan.billing_cycle === 'lifetime' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (subscriptionError) {
      throw new Error('Failed to create free subscription');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        subscription_id: subscription.id,
        free_plan: true,
      }),
    };
  }

  // Create Stripe payment intent for paid plans
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(plan.price * 100), // Convert to cents
    currency: 'usd',
    metadata: {
      type: 'subscription',
      user_id: userId,
      plan_id: planId,
    },
  });

  // Create transaction record
  const { data: transaction, error: transactionError } = await supabaseAdmin
    .from('transactions')
    .insert({
      user_id: userId,
      amount: plan.price,
      currency: 'USD',
      status: 'pending',
      payment_provider: 'stripe',
      payment_intent_id: paymentIntent.id,
      transaction_type: 'subscription',
      metadata: {
        plan_name: plan.name,
        billing_cycle: plan.billing_cycle,
      },
    })
    .select()
    .single();

  if (transactionError) {
    throw new Error('Failed to create transaction record');
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      client_secret: paymentIntent.client_secret,
      transaction_id: transaction.id,
    }),
  };
}
