/**
* This code was generated with the help of ChatGPT/GenAI and it was modified a bit to meet
* the speciifc requirement and standards. The prompt given was the hotels user story
* from the assignment.
*/

// src/app/(main)/hotels/[hotelId]/page.tsx
"use client"; // Essential for hooks like useParams, useState, useEffect

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Keep useRouter for future redirects
import { getHotelById, createItinerary } from '@/lib/api'; // Import API functions
import { Hotel, RoomType } from '@/types'; // Import your types
import Spinner from '@/components/ui/Spinner'; // Assuming Spinner uses default export
import { DatePicker } from '@/components/ui/DatePicker'; // Import your DatePicker
// Import your detail display components
import HotelDetailsView from '@/components/hotels/HotelDetailsView';
import RoomTypeList from '@/components/hotels/RoomTypeList';
import { formatDateForAPI } from '@/lib/utils'; // Assuming this helper exists
import { useAuth } from '@/contexts/AuthContext';

export default function HotelDetailPage() {
    const params = useParams();
    const router = useRouter(); // Keep for navigation after booking placeholder
    const hotelId = Array.isArray(params.hotelId) ? params.hotelId[0] : params.hotelId;

    // State stores the ACTUAL Hotel object or null
    const [hotelData, setHotelData] = useState<Hotel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isBooking, setIsBooking] = useState(false); // State for booking action
    const [error, setError] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);

    // State for selected check-in/out dates on this page
    const [checkInDate, setCheckInDate] = useState<Date | null>(null);
    const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
    const todayString = useMemo(() => formatDateForAPI(new Date()), []);
    const { user, refreshAccessToken, isTokenExpired } = useAuth();

    // Load token safely after hydration
    useEffect(() => {
        setToken(localStorage.getItem('accessToken'));
    }, []);

    const handleDateChange = useCallback((dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        if (start && end && start >= end) {
            setCheckInDate(start);
            setCheckOutDate(null);
        } else {
            setCheckInDate(start);
            setCheckOutDate(end);
        }
    }, []);

    useEffect(() => {
        if (!hotelId || isNaN(Number(hotelId))) {
            setError("Invalid Hotel ID provided in URL.");
            setIsLoading(false);
            return;
        }

        const fetchHotelData = async () => {
            setIsLoading(true); // Indicate loading state
            setError(null);

            // Determine if we should pass dates to the API
            let checkInStr: string | undefined = undefined;
            let checkOutStr: string | undefined = undefined;
            let fetchWithDates = false;

            // Only attempt to fetch with dates if BOTH are selected and valid
            if (checkInDate && checkOutDate && checkInDate < checkOutDate) {
                 checkInStr = formatDateForAPI(checkInDate);
                 checkOutStr = formatDateForAPI(checkOutDate);
                 fetchWithDates = true;
                 console.log(`EFFECT: Fetching hotel ${hotelId} WITH dates: ${checkInStr} - ${checkOutStr}`);
            } else {
                 // Fetch without dates initially or if dates become invalid/incomplete
                 console.log(`EFFECT: Fetching hotel ${hotelId} WITHOUT dates.`);
            }

            try {
                // Assume getHotelById now correctly returns Promise<{ hotel: Hotel } | null>
                // based on the previous fix to lib/api.ts return type hint
                const responseData: { hotel: Hotel } | null = await getHotelById(
                    hotelId,
                    fetchWithDates ? checkInStr : undefined,
                    fetchWithDates ? checkOutStr : undefined
                );
                console.log("EFFECT: API returned raw response:", responseData);

                // Check if the response itself is null OR if the nested 'hotel' property is missing/null
                if (!responseData || !responseData.hotel) {
                    console.error("EFFECT: API returned null, empty data, or incorrect structure.");
                    setError(`Hotel with ID ${hotelId} not found or data invalid.`);
                    setHotelData(null);
                } else {
                    // *** FIX: Extract the actual Hotel object before setting state ***
                    const actualHotelData = responseData.hotel;
                    console.log("EFFECT: Setting extracted hotel data:", actualHotelData);
                    // Now 'actualHotelData' is type 'Hotel', which matches setHotelData's expectation
                    setHotelData(actualHotelData);
                }
            } catch (err: any) {
                // Handle errors thrown by getHotelById (likely HTTPError)
                console.error("EFFECT: Error fetching hotel details:", err);
                setError(err.info?.error || err.message || "Failed to load hotel details.");
                setHotelData(null); // Clear data on error
            } finally {
                console.log("EFFECT: Setting loading to false.");
                setIsLoading(false); // Always finish loading
            }
        };

        fetchHotelData();
    }, [hotelId, checkInDate, checkOutDate]);

    const handleSelectRoom = async (details: any) => {
        if (!user) { 
            router.push('/');
            return; 
        }

        setIsBooking(true);
        if (!token) {
            setError("No access token found. Please log in again.");
            return;
        }
        if (isTokenExpired(token)) {
            await refreshAccessToken();
            setToken(localStorage.getItem('accessToken'));
        }

        try {
            console.log("BOOKING: Attempting to create booking with details:", details);
            const response = await fetch("/api/hotels/bookings", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(details),
            });
            console.log("BOOKING: API response:", response);
            const result = await response.json();

            if (!response.ok) {
                throw new Error("Failed to create a booking.");
            }
            const response2 = await fetch("/api/bookings/check", {
                method: "GET",
                headers: { 
                    'Authorization': `Bearer ${token}`

                },
            }); 
            const result2 = await response2.json();
            console.log("BOOKING: Itinerary check response:", result2);
    
            if (!response2.ok) {
                throw new Error(result2.error || "Failed to create a booking.");
            }

            if(result2.itinerary === null || result2.itinerary.hotelBooking !== result.booking.id){
                const response3 = await fetch("/api/bookings", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json" , 
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({"hotelBooking": result.booking.id}),
                });
                const result3 = await response3.json();
                console.log("BOOKING: Itinerary creation response:", result3);
    
                if (!response3.ok) {
                    throw new Error(result3.error || "Failed to create a booking itinerary.");
                }  
                window.location.href = `/bookings/${result3.itinerary.id}`;
            } else {
                const response3 = await fetch("/api/bookings/update", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json" , 
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({"hotelBooking": result.booking.id}),
                });
                const result3 = await response3.json();
                console.log("BOOKING: Itinerary update response:", result3);
    
                if (!response3.ok) {
                    throw new Error(result3.error || "Failed to update itinerary.");
                }  
                window.location.href = `/bookings/${result3.itinerary.id}`;
            }
        } catch (bookingError: any) {
            alert(`Booking failed: ${bookingError.message}`);
        } finally {
            setIsBooking(false);
        }
    };

    if (isLoading && !hotelData) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Spinner />
                <p className="ml-3 text-gray-600 dark:text-gray-400">Loading hotel details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10 px-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg max-w-md mx-auto">
                <h2 className="text-xl font-semibold text-red-700 dark:text-red-300 mb-2">Error Loading Hotel</h2>
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
        );
    }

    if (!hotelData) {
         return <div className="text-center py-10 text-gray-500 dark:text-gray-400">Hotel not found.</div>;
    }

    return (
        <div className="space-y-8 md:space-y-12">
             {/* Section for selecting dates */}
             <section className="p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-100">
                   Check Availability & Prices
                </h2>
                <div className="max-w-md">
                    <DatePicker
                        isRange={true}
                        startDate={checkInDate}
                        endDate={checkOutDate}
                        onChange={handleDateChange}
                        placeholderText="Check-in - Check-out Dates"
                        min={todayString} // Use the 'min' prop with the formatted string
                    />
                </div>
                 {isLoading && ( // Show subtle loading when refetching dates
                     <div className='flex items-center text-sm text-gray-500 dark:text-gray-400 mt-2'>
                         <Spinner /> <span className='ml-2'>Updating availability...</span>
                    </div>
                 )}
                {checkInDate && checkOutDate && !isLoading && (
                    <p className="text-sm mt-2 text-green-600 dark:text-green-400">
                        Showing availability for your selected dates.
                    </p>
                )}
             </section>

            {/* Display General Hotel Info */}
            {/* This component now receives the CORRECT hotel object */}
            <HotelDetailsView hotel={hotelData} />

             <hr className="my-6 md:my-8 border-gray-200 dark:border-gray-700" />

            {/* Display Room Types */}
            <section>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    Choose Your Room
                </h2>
                {/* This component now receives the CORRECT roomTypes array */}
                <RoomTypeList
                    roomTypes={hotelData.roomTypes || []} // Pass the roomTypes array from the correctly set hotelData
                    hotelId={hotelData.id}
                    checkInDate={checkInDate}
                    checkOutDate={checkOutDate}
                    onSelectRoom={handleSelectRoom} // Pass the handler
                    // Pass isBooking down if RoomCard should show loading state on its button
                    // isBooking={isBooking}
                />
            </section>
        </div>
    );
}

// Helper function (ensure this is in src/lib/utils.ts and imported)
// function formatDateForAPI(date: Date | null): string | undefined {
//     if (!date) return undefined;
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const day = String(date.getDate()).padStart(2, '0');
//     return ${year}-${month}-${day};
// };