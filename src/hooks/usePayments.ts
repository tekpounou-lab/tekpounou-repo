import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly' | 'lifetime';
  features: string[];
  max_courses?: number;
  max_students_per_course?: number;
  is_active: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired' | 'pending';
  start_date: string;
  end_date?: string;
  renewal_date?: string;
  stripe_subscription_id?: string;
  plan: SubscriptionPlan;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  payment_provider: string;
  payment_intent_id?: string;
  transaction_type: 'subscription' | 'course' | 'refund';
  course_id?: string;
  subscription_id?: string;
  metadata: Record<string, any>;
  processed_at?: string;
  created_at: string;
}

export const usePayments = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get subscription plans
  const getSubscriptionPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) throw error;
      return data as SubscriptionPlan[];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  // Get user's active subscriptions
  const getUserSubscriptions = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      return data as UserSubscription[];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  // Get user's transactions
  const getUserTransactions = async () => {
    if (!user) return [];

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  };

  // Create course payment intent
  const createCoursePaymentIntent = async (courseId: string) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          type: 'course',
          course_id: courseId,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment intent');
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create subscription payment intent
  const createSubscriptionPaymentIntent = async (planId: string) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          type: 'subscription',
          plan_id: planId,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create payment intent');
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Confirm payment
  const confirmPayment = async (paymentIntentId: string, paymentMethodId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/.netlify/functions/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          payment_intent_id: paymentIntentId,
          payment_method_id: paymentMethodId,
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payment confirmation failed');
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check if user can access course (free or paid)
  const canAccessCourse = async (courseId: string) => {
    if (!user) return false;

    try {
      // Check if course is free
      const { data: course } = await supabase
        .from('courses')
        .select('is_free, is_premium, price')
        .eq('id', courseId)
        .single();

      if (!course) return false;
      if (course.is_free && !course.is_premium) return true;

      // Check if user has paid for the course
      const { data: transaction } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .eq('status', 'completed')
        .eq('transaction_type', 'course')
        .single();

      if (transaction) return true;

      // Check if user has active subscription that covers this course
      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString())
        .single();

      return !!subscription;
    } catch (err: any) {
      console.error('Error checking course access:', err);
      return false;
    }
  };

  return {
    loading,
    error,
    getSubscriptionPlans,
    getUserSubscriptions,
    getUserTransactions,
    createCoursePaymentIntent,
    createSubscriptionPaymentIntent,
    confirmPayment,
    canAccessCourse,
  };
};

export const useTeacherEarnings = () => {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get teacher earnings
  const getTeacherEarnings = async () => {
    if (!user) return [];

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('teacher_earnings')
        .select(`
          *,
          course:courses(title),
          transaction:transactions(*)
        `)
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get teacher earnings summary
  const getEarningsSummary = async () => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('teacher_earnings')
        .select('net_amount, status')
        .eq('teacher_id', user.id);

      if (error) throw error;

      const summary = data.reduce((acc, earning) => {
        acc.total += earning.net_amount;
        acc[earning.status] = (acc[earning.status] || 0) + earning.net_amount;
        return acc;
      }, {
        total: 0,
        pending: 0,
        available: 0,
        paid: 0,
        hold: 0
      });

      return summary;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  // Request payout
  const requestPayout = async (amount: number) => {
    if (!user) throw new Error('User not authenticated');

    setLoading(true);
    try {
      const response = await fetch('/.netlify/functions/request-payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ amount })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Payout request failed');
      }

      return await response.json();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getTeacherEarnings,
    getEarningsSummary,
    requestPayout,
  };
};
