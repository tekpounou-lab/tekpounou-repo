import React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { BRAND_GRADIENT } from '../../styles/design-system';

// Custom toast notifications with brand styling and accessibility
interface CustomToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  description?: string;
}

const ToastContent: React.FC<CustomToastProps> = ({ message, type, description }) => {
  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon
  };

  const colors = {
    success: 'text-green-500',
    error: 'text-red-500',
    warning: 'text-yellow-500',
    info: 'text-blue-500'
  };

  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 50 }}
      className="
        flex items-start space-x-3 p-4 bg-white dark:bg-gray-800
        border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg
        max-w-md w-full
      "
      role="alert"
      aria-live="polite"
    >
      <Icon className={`h-6 w-6 ${colors[type]} flex-shrink-0 mt-0.5`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {message}
        </p>
        {description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            {description}
          </p>
        )}
      </div>
    </motion.div>
  );
};

// Toast helper functions
export const showToast = {
  success: (message: string, description?: string) => {
    toast.custom((t) => (
      <ToastContent message={message} type="success" description={description} />
    ), {
      duration: 4000,
      position: 'top-right'
    });
  },
  
  error: (message: string, description?: string) => {
    toast.custom((t) => (
      <ToastContent message={message} type="error" description={description} />
    ), {
      duration: 5000,
      position: 'top-right'
    });
  },
  
  warning: (message: string, description?: string) => {
    toast.custom((t) => (
      <ToastContent message={message} type="warning" description={description} />
    ), {
      duration: 4000,
      position: 'top-right'
    });
  },
  
  info: (message: string, description?: string) => {
    toast.custom((t) => (
      <ToastContent message={message} type="info" description={description} />
    ), {
      duration: 3000,
      position: 'top-right'
    });
  },
  
  loading: (message: string) => {
    return toast.loading(message, {
      style: {
        background: 'linear-gradient(135deg, #FF6B6B 0%, #FF2D95 50%, #913D88 100%)',
        color: 'white',
        borderRadius: '12px',
        padding: '16px',
        fontSize: '14px',
        fontWeight: '500'
      },
      duration: Infinity
    });
  },
  
  dismiss: (toastId?: string) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }
};

// Toast provider component
export const ToastProvider: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          margin: 0
        },
        success: {
          iconTheme: {
            primary: '#10B981',
            secondary: 'white'
          }
        },
        error: {
          iconTheme: {
            primary: '#EF4444',
            secondary: 'white'
          }
        }
      }}
    />
  );
};

export default ToastProvider;
