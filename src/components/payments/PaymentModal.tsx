import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { usePayments, SubscriptionPlan } from '@/hooks/usePayments';
import { formatPrice } from '@/lib/stripe';
import getStripe from '@/lib/stripe';
import { useAuthStore } from '@/stores/authStore';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: SubscriptionPlan;
  course?: {
    id: string;
    title: string;
    price: number;
    currency: string;
  };
  onSuccess: () => void;
}

const PaymentForm: React.FC<{
  plan?: SubscriptionPlan;
  course?: any;
  onSuccess: () => void;
  onError: (error: string) => void;
}> = ({ plan, course, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuthStore();
  const { createCoursePaymentIntent, createSubscriptionPaymentIntent } = usePayments();
  const [loading, setLoading] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState<any>(null);

  useEffect(() => {
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      let intent;
      if (course) {
        intent = await createCoursePaymentIntent(course.id);
      } else if (plan) {
        intent = await createSubscriptionPaymentIntent(plan.id);
      }
      setPaymentIntent(intent);
    } catch (error: any) {
      onError(error.message);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !paymentIntent) {
      return;
    }

    setLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
        paymentIntent.client_secret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: user?.email,
            },
          },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      if (confirmedIntent?.status === 'succeeded') {
        onSuccess();
      }
    } catch (error: any) {
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment details */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          Payment Details
        </h3>
        {plan && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{plan.name} Plan</span>
            <span className="font-semibold">{formatPrice(plan.price)}</span>
          </div>
        )}
        {course && (
          <div className="flex justify-between items-center">
            <span className="text-gray-600 dark:text-gray-400">{course.title}</span>
            <span className="font-semibold">{formatPrice(course.price, course.currency)}</span>
          </div>
        )}
      </div>

      {/* Card input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Card Information
        </label>
        <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {/* Security notice */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <Lock className="w-4 h-4" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || loading}
        isLoading={loading}
      >
        {loading ? 'Processing...' : `Pay ${formatPrice(plan?.price || course?.price || 0)}`}
      </Button>
    </form>
  );
};

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  plan,
  course,
  onSuccess,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const stripePromise = getStripe();

  const handleSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      onSuccess();
    }, 2000);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md"
          >
            <Card className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-6 h-6 text-pink-600" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Complete Payment
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Success state */}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Payment Successful!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {plan && 'Your subscription has been activated.'}
                    {course && 'You now have access to the course.'}
                  </p>
                </motion.div>
              )}

              {/* Error state */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-red-700 dark:text-red-400 font-medium">
                      Payment Failed
                    </span>
                  </div>
                  <p className="text-red-600 dark:text-red-300 mt-1 text-sm">
                    {error}
                  </p>
                </motion.div>
              )}

              {/* Payment form */}
              {!success && (
                <Elements stripe={stripePromise}>
                  <PaymentForm
                    plan={plan}
                    course={course}
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                </Elements>
              )}

              {/* Footer */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  By completing this purchase, you agree to our{' '}
                  <a href="/terms" className="text-pink-600 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="text-pink-600 hover:underline">
                    Privacy Policy
                  </a>
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
};
