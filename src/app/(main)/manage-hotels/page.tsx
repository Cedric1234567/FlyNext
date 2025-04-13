/**
* This code was generated with the help of ChatGPT/GenAI and it was modified a bit to meet
* the speciifc requirement and standards. The prompt given was the hotels user story
* from the assignment.
*/

// src/app/(main)/manage-hotels/page.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import next/image
import { useRouter } from 'next/navigation'; // Not strictly needed now, but useful for future actions
import { useRequireAuth } from '@/hooks/useRequireAuth'; // Import the auth hook
import { getMyHotels } from '@/lib/api'; // Import the API function
import { HotelSearchResult } from '@/types'; // Use the search result type for consistency (or Hotel if API returns that)
import { Button } from '@/components/ui/Button'; // Import your Button component
import Spinner from '@/components/ui/Spinner'; // Import your Spinner component
import RatingStarsDisplay from '@/components/ui/RatingStar'; // Import rating display

export default function ManageHotelsPage() {
    // 1. Protect Route & Get User Status
    // isLoading indicates if auth check is ongoing or redirect might happen
    const { user, isLoading: isAuthLoading } = useRequireAuth();

    // 2. State for Hotels, Page Loading, Errors
    const [myHotels, setMyHotels] = useState<HotelSearchResult[]>([]);
    const [isFetchingHotels, setIsFetchingHotels] = useState(false); // Specific loading for the fetch call
    const [pageError, setPageError] = useState<string | null>(null);

    // 3. Fetch Data Effect
    useEffect(() => {
        // Only fetch if auth check is complete AND user exists
        if (!isAuthLoading && user) {
            console.log("ManageHotelsPage: Auth verified and user present. Fetching hotels...");
            setIsFetchingHotels(true);
            setPageError(null); // Clear previous errors

            const fetchHotels = async () => {
                try {
                    // Call the authenticated API - expects { hotels: [...] }
                    const data = await getMyHotels();
                    console.log("ManageHotelsPage: Received data:", data);
                    setMyHotels(data.hotels || []); // Set state with the hotels array
                } catch (err: any) {
                    console.error("Failed to fetch owned hotels:", err);
                    // Avoid showing generic auth errors if redirect handles it
                    if (err.status !== 401 && err.status !== 403) {
                       setPageError(err.info?.error || err.message || "Could not load your hotels.");
                    }
                    setMyHotels([]); // Clear hotels on error
                } finally {
                    setIsFetchingHotels(false);
                }
            };

            fetchHotels();
        } else if (!isAuthLoading && !user) {
            // Auth check done, no user -> useRequireAuth handles redirect
            console.log("ManageHotelsPage: Auth verified, no user. Waiting for redirect.");
            // Clear state defensively
            setMyHotels([]);
            setIsFetchingHotels(false);
            setPageError(null);
        } else {
             // Auth is still loading, do nothing yet
             console.log("ManageHotelsPage: Auth still loading, fetch delayed.");
             // Ensure fetch loading is false if auth isn't ready
             setIsFetchingHotels(false);
        }
    }, [isAuthLoading, user]); // Dependency array


    // 4. Render Logic
    // Show main loading spinner ONLY while useRequireAuth is verifying/loading
    if (isAuthLoading) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
                <Spinner />
                <p className="ml-3 text-gray-600 dark:text-gray-400">Verifying access...</p>
            </div>
        );
    }

    // If auth is done, but there's no user, the redirect should handle it.
    // Show a minimal message just in case redirect is slow.
    if (!user) {
         return (
             <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                 Loading user session or redirecting...
            </div>
         );
    }

    // --- User is authenticated, render page content ---
    return (
        <div className="space-y-6">
            {/* Header with Add Button */}
            <div className="flex flex-wrap justify-between items-center gap-4 border-b pb-4 mb-6 dark:border-gray-700">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    Manage Your Hotels
                    {/* Optionally display user name if available and needed */}
                    {/* ({user.firstName || user.email}) */}
                </h1>
                <Link href="/manage-hotels/add">
                    <Button>+ Add New Hotel</Button>
                </Link>
            </div>

            {/* Content Area: Loading, Error, No Hotels, or Hotel List */}
            {isFetchingHotels ? (
                 <div className="flex justify-center items-center min-h-[200px]"><Spinner /> <span className="ml-2 text-gray-600 dark:text-gray-400">Loading hotels...</span></div>
            ) : pageError ? (
                 <div className="text-center py-10 px-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg max-w-lg mx-auto">
                    <h3 className="font-semibold text-red-700 dark:text-red-300">Failed to load hotels</h3>
                    <p className="text-sm mt-1 text-red-600 dark:text-red-400">{pageError}</p>
                 </div>
            ) : myHotels.length === 0 ? (
                 <div className="text-center py-10 text-gray-500 dark:text-gray-400 border border-dashed dark:border-gray-700 rounded-lg">
                     <p className="text-lg font-medium">No hotels found.</p>
                     <p className="mt-2">You haven't added any hotels yet.</p>
                     <div className="mt-4">
                         <Link href="/manage-hotels/add">
                            <Button variant="default">+ Add Your First Hotel</Button>
                         </Link>
                     </div>
                 </div>
            ) : (
                 // Render the grid of improved management cards
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                     {myHotels.map(hotel => (
                        // Improved Management Card structure
                         <div key={hotel.id} className="border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md">
                            {/* Optional Image */}
                            <div className="relative w-full h-36 sm:h-44 bg-gray-100 dark:bg-gray-700">
                                {hotel.mainImage ? (
                                    <img
                                        src={hotel.mainImage}
                                        alt={`Image of ${hotel.name}`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} // Hide if broken
                                    />
                                 ) : (
                                     <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500 text-sm">No Image</div>
                                 )}
                            </div>
                            {/* Content Area */}
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="text-base sm:text-lg font-semibold mb-1 truncate text-gray-900 dark:text-white" title={hotel.name}>
                                    {hotel.name}
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3 truncate" title={hotel.location}>
                                    📍 {hotel.location}
                                </p>
                                {/* Optional: Rating */}
                                {hotel.starRating && (
                                     <div className="mb-3">
                                         <RatingStarsDisplay rating={hotel.starRating} />
                                     </div>
                                )}

                                {/* Action Button - Pushed to bottom */}
                                <div className="mt-auto pt-3 border-t dark:border-gray-600">
                                     <Link href={`/manage-hotels/${hotel.id}`} className="block">
                                         <Button variant="outline" size="sm" className="w-full">
                                             Manage Details & Rooms
                                         </Button>
                                     </Link>
                                </div>
                            </div>
                        </div>
                     ))}
                 </div>
            )}
        </div>
    );
}