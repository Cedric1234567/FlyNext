// src/components/ui/DatePicker.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// Interfaces: Add min prop (string)
export interface SingleDatePickerProps {
  selectedDate?: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  inputClassName?: string;
  hasError?: boolean;
  min?: string; // <-- ADD min prop (YYYY-MM-DD string)
}

export interface DateRangePickerProps {
  startDate?: Date | null;
  endDate?: Date | null;
  onChange: (dates: [Date | null, Date | null]) => void;
  isRange: true;
  placeholderText?: string;
  inputClassName?: string;
  hasError?: boolean;
  min?: string; // <-- ADD min prop (YYYY-MM-DD string)
}

type DatePickerProps = SingleDatePickerProps | DateRangePickerProps;

const formatDate = (date?: Date | null) => {
  if (!date) return '';
  return date.toISOString().split('T')[0];
};

const DatePicker: React.FC<DatePickerProps> = (props) => {
  if ('isRange' in props && props.isRange) {
    const { startDate, endDate, onChange, placeholderText, inputClassName, hasError, min } = // <-- Destructure min
      props as DateRangePickerProps;

    const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newStart = e.target.value ? new Date(e.target.value) : null;
      onChange([newStart, endDate || null]);
    };

    const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newEnd = e.target.value ? new Date(e.target.value) : null;
      // Prevent end date being before start date directly in input if possible
      if (startDate && newEnd && newEnd < startDate) {
           onChange([startDate, startDate]); // Or provide some feedback
      } else {
          onChange([startDate || null, newEnd]);
      }
    };

    return (
      <div className={cn('flex space-x-2', inputClassName)}>
        <input
          type="date"
          value={formatDate(startDate)}
          onChange={handleStartChange}
          placeholder={placeholderText || 'Start date'}
          className={cn(/* ... */)}
          min={min} // <-- Pass min prop to the input
        />
        <input
          type="date"
          value={formatDate(endDate)}
          onChange={handleEndChange}
          placeholder={placeholderText || 'End date'}
          className={cn(/* ... */)}
          min={startDate ? formatDate(startDate) : min} // <-- End date min should be start date or overall min
        />
      </div>
    );
  } else {
    const { selectedDate, onChange, placeholderText, inputClassName, hasError, min } = // <-- Destructure min
      props as SingleDatePickerProps;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = e.target.value ? new Date(e.target.value) : null;
      onChange(newDate);
    };

    return (
      <input
        type="date"
        value={formatDate(selectedDate)}
        onChange={handleChange}
        placeholder={placeholderText || 'Select date'}
        className={cn(/* ... */)}
        min={min} // <-- Pass min prop to the input
      />
    );
  }
};

export { DatePicker };