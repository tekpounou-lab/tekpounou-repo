import React from 'react';
import { cn } from '@/utils';

interface ProgressProps {
  value: number;
  className?: string;
  showPercentage?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({ 
  value, 
  className,
  showPercentage = false 
}) => {
  const percentage = Math.min(Math.max(value, 0), 100);

  return (
    <div className={cn('w-full', className)}>
      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {percentage.toFixed(0)}%
        </div>
      )}
    </div>
  );
};
