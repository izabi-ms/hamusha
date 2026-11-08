import React from 'react';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
};

export default function LoadingSpinner({ fullScreen = false, size = 'md' }: LoadingSpinnerProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 z-50" role="status" aria-label="Loading">
        <div className={`spinner ${sizeClasses[size]}`} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-8" role="status" aria-label="Loading">
      <div className={`spinner ${sizeClasses[size]}`} aria-hidden="true" />
    </div>
  );
}