// src/components/ui/Spinner.tsx
import React from 'react';

interface SpinnerProps {
    size?: 'small' | 'medium' | 'large';
    color?: string;
    className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
    size = 'medium',
    color = 'currentColor',
    className = '',
}) => {
    // Determine the size in pixels
    const sizeInPx = {
        small: 16,
        medium: 24,
        large: 32,
    }[size];

    return (
        <div className={`inline-block ${className}`} role="status" aria-label="loading">
            <svg 
                className="animate-spin"
                style={{ width: sizeInPx, height: sizeInPx }}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke={color}
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill={color}
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
        </div>
    );
};

export default Spinner;