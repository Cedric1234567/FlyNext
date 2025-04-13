/**
* This code was generated with the help of ChatGPT/GenAI and it was modified a bit to meet
* the speciifc requirement and standards. The prompt given was the hotels user story
* from the assignment.
*/

// src/app/(main)/manage-hotels/add/page.tsx
"use client";

import React from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth'; // Protect the page
import HotelManagementForm from '@/components/hotels/HotelManagementForm';
import Spinner from '@/components/ui/Spinner';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function AddHotelPage() {
    const { user, isLoading: isAuthLoading } = useRequireAuth();

    if (isAuthLoading) {
        return (
             <div className="flex justify-center items-center min-h-[300px]">
                <Spinner /> <span className="ml-3">Loading...</span>
             </div>
        );
    }

     // If useRequireAuth handles redirect, this might not be strictly needed, but safe fallback
     if (!user) {
        return <div className="p-4 text-center">Please log in to add a hotel.</div>;
     }


    return (
        <div className="max-w-3xl mx-auto p-4 md:p-6">
             <div className="mb-6">
                <Link href="/manage-hotels">
                     <Button variant="outline" size="sm">← Back to My Hotels</Button>
                 </Link>
             </div>
            {/* Render the form in "create" mode (no initialData) */}
            {/* onSubmitSuccess is handled by default redirect in the form */}
            <HotelManagementForm />
        </div>
    );
}