// src/components/ui/Button.tsx
import React from 'react';
import { cn } from '@/lib/utils'; // Your utility for merging class names

// Helper function to build button classes
function getButtonClasses({
  variant = 'default',
  size = 'default',
  className = '',
}: {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';

  let variantClasses = '';
  switch (variant) {
    case 'destructive':
      variantClasses =
        'bg-red-600 text-destructive-foreground hover:bg-red-700/90 dark:bg-red-500 dark:hover:bg-red-600/90';
      break;
    case 'outline':
      variantClasses = 'border border-input bg-background hover:bg-accent hover:text-accent-foreground';
      break;
    case 'secondary':
      variantClasses =
        'bg-gray-200 text-secondary-foreground hover:bg-gray-300/80 dark:bg-gray-700 dark:hover:bg-gray-600/80';
      break;
    case 'ghost':
      variantClasses = 'hover:bg-accent hover:text-accent-foreground dark:hover:bg-gray-700';
      break;
    case 'link':
      variantClasses = 'text-primary underline-offset-4 hover:underline';
      break;
    case 'default':
    default:
      variantClasses =
        'bg-blue-600 text-primary-foreground hover:bg-blue-700/90 dark:bg-blue-500 dark:hover:bg-blue-600/90';
  }

  let sizeClasses = '';
  switch (size) {
    case 'sm':
      sizeClasses = 'h-9 rounded-md px-3';
      break;
    case 'lg':
      sizeClasses = 'h-11 rounded-md px-8';
      break;
    case 'icon':
      sizeClasses = 'h-10 w-10';
      break;
    case 'default':
    default:
      sizeClasses = 'h-10 px-4 py-2';
  }

  return cn(baseClasses, variantClasses, sizeClasses, className);
}

// Spinner component (simple inline SVG)
const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4 text-current"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// Define Props interface for Button
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
}

// Create the Button component
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, isLoading = false, disabled, ...props }, ref) => {
    const isDisabled = disabled || isLoading;

    return (
      <button
        className={getButtonClasses({ variant, size, className })}
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <Spinner />
          </div>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, getButtonClasses };
