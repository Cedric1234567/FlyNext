/**
* This code was generated with the help of ChatGPT/GenAI and it was modified a bit to meet
* the speciifc requirement and standards. The prompt given was the accounts/login user story
* from the assignment.
*/

// src/app/(main)/login/page.tsx
import React, { Suspense } from 'react'; // Import Suspense
import LoginFormWrapper from '@/components/auth/LoginFormWrapper'; // Import the new component
import Spinner from '@/components/ui/Spinner'; // Import a Spinner for fallback

// Optional: Add Metadata if needed for the page
// export const metadata = { title: 'Login - FlyNext' };

// This page component can now be simpler
export default function LoginPage() {

  // Fallback UI to show while LoginFormWrapper (client component) loads
  const LoadingFallback = () => (
    <div className="flex justify-center items-center min-h-[300px]"> {/* Adjust height as needed */}
      <Spinner />
       <p className="ml-3 text-gray-600 dark:text-gray-400">Loading Login Form...</p>
    </div>
  );

  return (
    // This outer div provides the centering for the login box
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* Wrap the client component needing useSearchParams in Suspense */}
        <Suspense fallback={<LoadingFallback />}>
            <LoginFormWrapper />
        </Suspense>
    </div>
  );
}
