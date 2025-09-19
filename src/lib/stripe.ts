import { loadStripe, Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
      import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 
      ''
    );
  }
  return stripePromise;
};

export default getStripe;

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 
                  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  
  // Payment method types to accept
  paymentMethodTypes: ['card', 'bancontact', 'ideal'] as const,
  
  // Supported currencies
  supportedCurrencies: ['USD', 'EUR', 'HTG'] as const,
  
  // Default currency
  defaultCurrency: 'USD' as const,
};

// Payment utilities
export const formatPrice = (
  amount: number, 
  currency: string = STRIPE_CONFIG.defaultCurrency
) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  });
  
  return formatter.format(amount);
};

export const convertToStripeAmount = (amount: number, currency: string) => {
  // Stripe expects amounts in the smallest currency unit
  // USD: cents, EUR: cents, HTG: centimes
  const zeroDecimalCurrencies = ['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'];
  
  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return Math.round(amount);
  }
  
  return Math.round(amount * 100);
};

export const convertFromStripeAmount = (amount: number, currency: string) => {
  const zeroDecimalCurrencies = ['BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'];
  
  if (zeroDecimalCurrencies.includes(currency.toUpperCase())) {
    return amount;
  }
  
  return amount / 100;
};

// Payment validation
export const validatePaymentAmount = (amount: number, currency: string) => {
  const minAmounts: Record<string, number> = {
    USD: 0.50,
    EUR: 0.50,
    HTG: 25.00, // Approximately $0.50 USD
  };
  
  const minAmount = minAmounts[currency.toUpperCase()] || 0.50;
  return amount >= minAmount;
};

// Create payment intent options
export const createPaymentIntentOptions = (
  amount: number,
  currency: string,
  metadata: Record<string, string> = {}
) => {
  return {
    amount: convertToStripeAmount(amount, currency),
    currency: currency.toLowerCase(),
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  };
};
