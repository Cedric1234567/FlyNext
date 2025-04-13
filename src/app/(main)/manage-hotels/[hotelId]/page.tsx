/**
* This code was generated with the help of ChatGPT/GenAI and it was modified a bit to meet
* the speciifc requirement and standards. The prompt given was the hotels user story
* from the assignment.
*/

// src/app/(main)/manage-hotels/[hotelId]/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // Import Link for Manage Rooms button
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { getHotelById, deleteHotel } from '@/lib/api'; // Import API functions
import { Hotel } from '@/types';
import Spinner from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import HotelManagementForm from '@/components/hotels/HotelManagementForm'; // Import the form
import { HTTPError } from '@/lib/api'; // Import error type

export default function EditHotelPage() {
    const { user, isLoading: isAuthLoading } = useRequireAuth();
    const router = useRouter();
    const params = useParams();
    const hotelId = Array.isArray(params.hotelId) ? params.hotelId[0] : params.hotelId;

    const [hotelData, setHotelData] = useState<Hotel | null>(null);
    const [isLoadingPage, setIsLoadingPage] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch Hotel Data Effect
    useEffect(() => {
        // Ensure user/auth is loaded and hotelId looks valid
        if (!isAuthLoading && user && hotelId && !isNaN(Number(hotelId))) {
            setIsLoadingPage(true);
            setPageError(null);
            console.log(`EditHotelPage: Fetching hotel ${hotelId} for user ${user.id}`);

            getHotelById(hotelId) // Fetch without dates for editing
                .then(responseData => {
                    const fetchedHotel = responseData?.hotel; // Extract nested hotel
                    if (!fetchedHotel) {
                        throw new Error(`Hotel with ID ${hotelId} not found.`);
                    }
                    // *** Perform Client-Side Ownership Check ***
                    // IMPORTANT: The definitive check MUST be on the backend API (PATCH/DELETE routes)
                    if (fetchedHotel.ownerId !== user.id) {
                         console.error(`Ownership mismatch! User ${user.id} tried to edit hotel ${hotelId} owned by ${fetchedHotel.ownerId}`);
                         throw new Error("You do not have permission to edit this hotel.");
                    }
                    console.log("EditHotelPage: Hotel data fetched:", fetchedHotel);
                    setHotelData(fetchedHotel); // Set the validated hotel data
                })
                .catch(err => {
                    console.error("Failed to fetch hotel for editing:", err);
                    setPageError(err instanceof HTTPError ? (err.info?.error || err.message) : (err.message || 'Could not load hotel data.'));
                    setHotelData(null);
                })
                .finally(() => {
                    setIsLoadingPage(false);
                });
        } else if (!isAuthLoading && user && (!hotelId || isNaN(Number(hotelId)))) {
            // Handle invalid ID after auth check
            setPageError("Invalid Hotel ID in URL.");
            setIsLoadingPage(false);
            setHotelData(null); // Clear data if ID is invalid
        }
        // If !isAuthLoading && !user, useRequireAuth handles redirect

    }, [isAuthLoading, user, hotelId]); // Dependencies


    // --- Delete Handler ---
    const handleDelete = async () => {
        if (!hotelData) return; // Safety check

        if (window.confirm(`Are you sure you want to permanently delete "${hotelData.name}"? This action will remove all associated rooms and bookings and cannot be undone.`)) {
            setIsDeleting(true);
            setPageError(null);
            try {
                await deleteHotel(hotelData.id); // Call API to delete
                alert("Hotel deleted successfully.");
                router.push('/manage-hotels'); // Redirect to list
                // No need to refresh explicitly as we are navigating away
            } catch (err: any) {
                console.error("Failed to delete hotel:", err);
                setPageError(err instanceof HTTPError ? (err.info?.error || err.message) : (err.message || 'Could not delete hotel.'));
                setIsDeleting(false); // Re-enable button on error
            }
            // No finally needed for isDeleting as we navigate on success
        }
    };


    // --- Render Logic ---
    if (isAuthLoading || isLoadingPage) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
                <Spinner /> <span className="ml-3 text-gray-600 dark:text-gray-400">Loading Hotel Data...</span>
            </div>
        );
    }

    if (!user) { // Should be handled by useRequireAuth redirect
         return <div className="text-center py-10">Loading session...</div>;
    }

    if (pageError) { // Handle page-level errors (fetch, delete, permission)
         return (
             <div className="text-center py-10 px-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg max-w-lg mx-auto">
                 <p className="font-semibold text-red-700 dark:text-red-300">Error</p>
                 <p className="mt-1 text-sm text-red-600 dark:text-red-400">{pageError}</p>
                 <Button variant="link" onClick={() => router.push('/manage-hotels')} className="mt-4">Go Back to My Hotels</Button>
             </div>
         );
    }

    if (!hotelData) { // Handle case where hotel wasn't found after loading
         return <div className="text-center py-10 text-gray-500 dark:text-gray-400">Hotel not found.</div>;
    }

    // --- Success: Render Form, Delete Section, Manage Rooms Link ---
// --- Success: Render Form, Management Links, Delete Section ---
        return (
            <div className="space-y-8 max-w-3xl mx-auto p-4 md:p-6">
                {/* Back Link */}
                <div className="mb-4">
                    <Link href="/manage-hotels">
                        <Button variant="outline" size="sm">← Back to My Hotels</Button>
                    </Link>
                </div>

                {/* Edit Hotel Form */}
                <HotelManagementForm initialData={hotelData} />

                {/* Management Links Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 pt-6 border-t dark:border-gray-700">
                    {/* Link to Manage Rooms Page */}
                    <div className="text-center md:text-left">
                        <Link href={`/manage-hotels/${hotelId}/manage-rooms`}>
                            <Button variant='secondary' className="w-full md:w-auto">Manage Room Types</Button>
                        </Link>
                    </div>
                    {/* *** ADDED: Link to Manage Bookings Page *** */}
                    <div className="text-center md:text-right">
                        <Link href={`/manage-hotels/${hotelId}/manage-bookings`}>
                            <Button variant='default' className="w-full md:w-auto">View & Manage Bookings</Button>
                        </Link>
                    </div>
                </div>


            <hr className="my-8 border-gray-300 dark:border-gray-700" />

            {/* Delete Section */}
            <div className="p-4 border border-red-300 dark:border-red-700/50 rounded-lg bg-red-50 dark:bg-red-900/20">
                 <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-2">Delete Hotel</h3>
                 <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                     Deleting this hotel will also remove all its associated room types and bookings. This action is permanent and cannot be undone.
                 </p>
                 <Button
                     variant="destructive"
                     onClick={handleDelete}
                     isLoading={isDeleting}
                     disabled={isDeleting}
                 >
                    {isDeleting ? 'Deleting...' : 'Delete this Hotel Permanently'}
                 </Button>
            </div>
        </div>
    );
}