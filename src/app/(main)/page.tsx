/**
* This code was generated with the help of ChatGPT/GenAI and it was modified a bit to meet
* the speciifc requirement and standards. 
*/

// src/app/(main)/page.tsx
'use client';

import React from 'react';
// import { useAuth } from '@/hooks/useAuth'; // Commented out until auth is implemented
import { useTheme } from '@/hooks/useTheme';

// Define type for user
type User = {
  firstName: string;
};

export default function LandingPage() {
  // Placeholder auth values until auth is implemented
  const user: User | null = null; // Set to null for logged out state, or { firstName: 'Test User' } for logged in state
  const isLoading = false;
  
  const { theme } = useTheme();

  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold mb-4">Welcome to FlyNext!</h1>
      <p className="mb-2">Your reliable travel companion.</p>
      <p className="mb-2">Current Theme: {theme}</p>
      {isLoading ? (
        <p>Checking authentication...</p>
      ) : user ? (
        <p>Logged in as: {"test!"}</p>
      ) : (
        <p>You are currently logged out.</p>
      )}
      <div className="mt-8 p-6 border rounded-lg bg-white dark:bg-gray-800 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Start Planning Your Trip</h2>
        {/* Placeholder for where the combined Flight/Hotel search form will go */}
        <div className="text-gray-500 dark:text-gray-400">
          [Search Forms Placeholder]
        </div>
      </div>
    </div>
  );
}
