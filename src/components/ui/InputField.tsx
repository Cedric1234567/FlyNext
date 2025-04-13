// src/components/ui/inputs/InputField.tsx
import React, { ChangeEvent, InputHTMLAttributes, forwardRef } from 'react';

interface InputFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    label?: string;
    error?: string;
    onChange?: (value: string) => void;
    fullWidth?: boolean;
}

const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
    ({ label, error, onChange, fullWidth = false, className = '', ...props }, ref) => {
        const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
            onChange?.(e.target.value);
        };

        return (
            <div className={`flex flex-col ${fullWidth ? 'w-full' : ''} ${className}`}>
                {label && (
                    <label className="mb-1 text-sm font-medium text-gray-700">{label}</label>
                )}
                
                <input
                    ref={ref}
                    className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        error ? 'border-red-500' : 'border-gray-300'
                    }`}
                    onChange={handleChange}
                    {...props}
                />
                
                {error && (
                    <p className="mt-1 text-sm text-red-500">{error}</p>
                )}
            </div>
        );
    }
);

InputField.displayName = 'InputField';

export default InputField;
export { InputField };