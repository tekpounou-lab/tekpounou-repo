import React from 'react';
import { motion } from 'framer-motion';
import { BRAND_COLORS, BRAND_GRADIENT } from '../styles/design-system';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'full' | 'icon' | 'text';
}

const sizeMap = {
  sm: { logo: 'h-8 w-8', text: 'text-lg' },
  md: { logo: 'h-10 w-10', text: 'text-xl' },
  lg: { logo: 'h-12 w-12', text: 'text-2xl' },
  xl: { logo: 'h-16 w-16', text: 'text-3xl' }
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = true,
  className = '',
  variant = 'full'
}) => {
  const { logo: logoSize, text: textSize } = sizeMap[size];

  if (variant === 'icon') {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`${logoSize} ${className}`}
      >
        <img 
          src="/logo.png" 
          alt="Tek Pou Nou Logo" 
          className="w-full h-full object-contain"
        />
      </motion.div>
    );
  }

  if (variant === 'text') {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={className}
      >
        <h1 
          className={`font-bold tracking-tight ${textSize}`}
          style={{ 
            background: BRAND_GRADIENT,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Tek Pou Nou
        </h1>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className={`flex items-center space-x-2 ${className}`}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className={logoSize}>
        <img 
          src="/logo.png" 
          alt="Tek Pou Nou Logo" 
          className="w-full h-full object-contain"
        />
      </div>
      {showText && (
        <h1 
          className={`font-bold tracking-tight ${textSize}`}
          style={{ 
            background: BRAND_GRADIENT,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          Tek Pou Nou
        </h1>
      )}
    </motion.div>
  );
};

interface BrandButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const BrandButton: React.FC<BrandButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const variantClasses = {
    primary: `text-white focus:ring-pink-500 hover:shadow-lg active:scale-95`,
    secondary: `bg-white text-gray-900 border-2 border-gray-200 hover:border-gray-300 focus:ring-gray-500 active:scale-95`,
    ghost: `text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:scale-95`
  };

  return (
    <motion.button
      whileHover={{ scale: variant === 'primary' ? 1.02 : 1.01 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      style={variant === 'primary' ? { 
        background: BRAND_GRADIENT,
        backgroundSize: '200% 200%',
        animation: 'gradient-shift 3s ease infinite'
      } : {}}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
          <path fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
        </svg>
      ) : null}
      {children}
    </motion.button>
  );
};

export const BrandCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}> = ({ children, className = '', hover = true }) => {
  return (
    <motion.div
      whileHover={hover ? { y: -2, shadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' } : {}}
      className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}
      style={{
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
      }}
    >
      {children}
    </motion.div>
  );
};

// CSS animations for gradient shift
const gradientKeyframes = `
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = gradientKeyframes;
  document.head.appendChild(style);
}
