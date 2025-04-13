/**
* This code was generated with the help of ChatGPT/GenAI and it was modified a bit to meet
* the speciifc requirement and standards. The prompt given was the hotels user story
* from the assignment.
*/

// src/app/(main)/manage-hotels/[hotelId]/manage-bookings/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { getHotelById, getHotelBookingsForOwner, cancelHotelBooking } from '@/lib/api'; // Import API functions
import type { HotelBookingFilters } from '@/lib/api'; // Import filter type
import { Hotel, RoomType, User as UserType } from '@/types'; // Import types
import Spinner from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';
import { formatDateForAPI } from '@/lib/utils'; // Import date formatter
import { HTTPError } from '@/lib/api';

// Define Booking type from Prisma schema
interface Booking {
    id: number;
    userId: number;
    hotelId: number;
    roomTypeId: number;
    checkInDate: string | Date;
    checkOutDate: string | Date;
    status: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    
    // Relations - optional as they might not always be included in responses
    user?: UserType;
    hotel?: Hotel;
    roomType?: RoomType;
    itinerary?: any[];
}

// Define booking type with user and room type details locally if not done globally
interface BookingWithDetails extends Omit<Booking, 'user' | 'roomType'> {
    user?: Partial<UserType>; // Use Partial for safety
    roomType?: Pick<RoomType, 'id' | 'name'>;
}

export default function ManageHotelBookingsPage() {
    const { user, isLoading: isAuthLoading } = useRequireAuth();
    const router = useRouter();
    const params = useParams();
    const hotelIdParam = Array.isArray(params.hotelId) ? params.hotelId[0] : params.hotelId;
    const hotelId = hotelIdParam ? parseInt(hotelIdParam, 10) : NaN;

    // State
    const [hotelData, setHotelData] = useState<Hotel | null>(null);
    const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
    const [isLoadingHotel, setIsLoadingHotel] = useState(true);
    const [isLoadingBookings, setIsLoadingBookings] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState<number | null>(null);

    // State for filters
    const [filterRoomTypeId, setFilterRoomTypeId] = useState<string>('all');
    const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
    const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);

    // --- Fetch initial hotel data ---
    useEffect(() => {
        if (!isAuthLoading && user && !isNaN(hotelId)) {
            console.log("Fetching hotel details for filters...");
            setIsLoadingHotel(true);
            getHotelById(hotelId)
                .then(responseData => {
                    const fetchedHotel = responseData?.hotel;
                    if (!fetchedHotel || fetchedHotel.ownerId !== user.id) {
                        throw new Error("Hotel not found or permission denied.");
                    }
                    setHotelData(fetchedHotel);
                })
                .catch(err => {
                    console.error("Failed to fetch hotel details:", err);
                    setPageError(err.message || "Could not load hotel info.");
                    setHotelData(null);
                })
                .finally(() => setIsLoadingHotel(false));
        } else if (!isAuthLoading) {
            setIsLoadingHotel(false);
             if (isNaN(hotelId)) setPageError("Invalid Hotel ID.");
        }
    }, [isAuthLoading, user, hotelId]);


    // --- Fetch Bookings ---
    const fetchBookings = useCallback(async (currentFilters: HotelBookingFilters = {}) => {
        if (isNaN(hotelId) || !user) return;

        console.log(`Fetching bookings for hotel ${hotelId} with filters:`, currentFilters);
        setIsLoadingBookings(true);
        setPageError(null); // Clear previous booking-specific errors

        try {
            const bookingsResponse = await getHotelBookingsForOwner(hotelId, currentFilters);
            // Handle both direct array return or object with bookings property
            const bookingsArray = Array.isArray(bookingsResponse) 
                ? bookingsResponse 
                : (bookingsResponse as { bookings: BookingWithDetails[] })?.bookings || [];
            setBookings(bookingsArray);
        } catch (err: any) {
            console.error("Failed to fetch hotel bookings:", err);
            if (!(err instanceof HTTPError && (err.status === 401 || err.status === 403))) {
                setPageError(err.info?.error || err.message || 'Could not load booking data.');
            }
            setBookings([]);
        } finally {
            setIsLoadingBookings(false);
        }
    }, [hotelId, user]);

    // Effect to trigger initial booking fetch *after* auth is ready
    useEffect(() => {
        if (!isAuthLoading && user) {
            fetchBookings({}); // Initial fetch
        }
    }, [isAuthLoading, user, fetchBookings]);


    // --- Action Handlers ---
    const handleApplyFilters = () => {
         if (filterStartDate && filterEndDate && filterStartDate >= filterEndDate) { alert("Filter end date must be after start date."); return; }
         if ((filterStartDate && !filterEndDate) || (!filterStartDate && filterEndDate)) { alert("Both start and end dates must be selected for date filtering, or leave both blank."); return; }

        const currentFilters: HotelBookingFilters = {
            roomTypeId: filterRoomTypeId === 'all' ? undefined : Number(filterRoomTypeId), // Send number or undefined
            startDate: formatDateForAPI(filterStartDate),
            endDate: formatDateForAPI(filterEndDate),
        };
         Object.keys(currentFilters).forEach(key => (currentFilters[key as keyof HotelBookingFilters] == null) && delete currentFilters[key as keyof HotelBookingFilters]);

        fetchBookings(currentFilters); // Refetch data with new filters
    };

     const handleFilterDateChange = (dates: [Date | null, Date | null]) => {
         const [start, end] = dates;
         setFilterStartDate(start);
         setFilterEndDate(end);
     };

    const handleCancelBooking = async (bookingId: number, guestName: string) => {
        if(isCancelling !== null) return;

         if (window.confirm(`Are you sure you want to cancel the booking for ${guestName} (ID: ${bookingId})? The guest might be notified.`)) {
             setIsCancelling(bookingId);
             setPageError(null);
             try {
                 await cancelHotelBooking(bookingId);
                 alert(`Booking ${bookingId} cancelled successfully.`);
                 // Refetch bookings with current filters to update list
                 const currentFilters: HotelBookingFilters = { // Reconstruct filters for refetch
                     roomTypeId: filterRoomTypeId === 'all' ? undefined : Number(filterRoomTypeId),
                     startDate: formatDateForAPI(filterStartDate),
                     endDate: formatDateForAPI(filterEndDate),
                 };
                 Object.keys(currentFilters).forEach(key => (currentFilters[key as keyof HotelBookingFilters] == null) && delete currentFilters[key as keyof HotelBookingFilters]);
                 fetchBookings(currentFilters); // Refetch after cancel
             } catch (err: any) {
                  console.error(`Failed to cancel booking ${bookingId}:`, err);
                  setPageError(err instanceof HTTPError ? (err.info?.error || err.message) : (err.message || 'Could not cancel booking.'));
             } finally {
                  setIsCancelling(null);
             }
         }
    };

    // --- Render Logic ---

    // Combined initial loading state
    const showInitialLoading = isAuthLoading || isLoadingHotel;
    // Page error takes precedence if hotel fetch failed
    const showPageError = !isLoadingHotel && pageError;
    // Show booking specific loading only after initial loads are done
    const showBookingLoading = !showInitialLoading && !showPageError && isLoadingBookings;
    // Can render content only when auth/hotel load done, no page error, and user exists
    const canRenderContent = !isAuthLoading && !isLoadingHotel && !pageError && user && hotelData;

    if (showInitialLoading) {
        return <div className="flex justify-center items-center min-h-[300px]"><Spinner /><span className="ml-3">Loading Page...</span></div>;
    }

    if (!user) { // Should be handled by redirect, but render minimal state
        return <div className="p-4 text-center">Loading session...</div>;
    }

    if (showPageError) { // Display critical page errors (invalid ID, permissions, hotel fetch fail)
         return (
             <div className="text-center py-10 px-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg max-w-lg mx-auto">
                 <p className="font-semibold text-red-700 dark:text-red-300 text-lg">Error</p>
                 <p className="mt-1 text-sm text-red-600 dark:text-red-400">{pageError}</p>
                 <Link href={isNaN(hotelId) ? '/manage-hotels' : `/manage-hotels/${hotelId}`}><Button variant="link" className="mt-4">Back to Hotel</Button></Link>
             </div>
         );
    }

    if (!hotelData) { // Should ideally be caught by pageError, but safeguard
         return <div className="text-center py-10">Hotel data not found or unavailable.</div>;
    }

    // --- Main Content Render ---
    // Now we know user and hotelData exist
    return (
        // *** CORRECTED: Added closing parenthesis for the main return ***
        <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
             <div className="flex flex-wrap justify-between items-center gap-4 border-b pb-4 mb-6 dark:border-gray-700">
                 <div>
                     <Link href={`/manage-hotels/${hotelId}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">← Back to Edit Hotel</Link>
                     <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                        Bookings for "{hotelData.name}"
                     </h1>
                 </div>
            </div>

             {/* Filters Section */}
             <div className="p-4 bg-gray-100 dark:bg-gray-800 border dark:border-gray-700 rounded-lg flex flex-col md:flex-row md:items-end gap-4">
                 {/* Date Filter */}
                 <div className='flex-grow'>
                     <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Filter by Date Range (Overlap)</label>
                     <DatePicker
                         isRange={true}
                         startDate={filterStartDate}
                         endDate={filterEndDate}
                         onChange={handleFilterDateChange}
                         placeholderText="Any Check-in/Out Date"
                         min={undefined} // Allow past dates for viewing history
                     />
                 </div>
                 {/* Room Type Filter */}
                 <div className='w-full md:w-auto md:min-w-[200px]'>
                    <label htmlFor="room-type-filter" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Filter by Room Type</label>
                    <select
                        id="room-type-filter"
                        value={filterRoomTypeId}
                        onChange={(e) => setFilterRoomTypeId(e.target.value)}
                        className="block w-full h-10 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        disabled={isLoadingHotel || !hotelData.roomTypes} // Disable while hotel loading
                    >
                        <option value="all">All Room Types</option>
                        {hotelData.roomTypes?.map(rt => (
                            <option key={rt.id} value={rt.id}>{rt.name}</option>
                        ))}
                    </select>
                 </div>
                  {/* Apply Button */}
                  <div className='flex-shrink-0'>
                      <Button onClick={handleApplyFilters} disabled={isLoadingBookings}>Apply Filters</Button>
                  </div>
             </div>

              {/* Bookings List/Table */}
              {showBookingLoading ? ( // Specific loading indicator for bookings list
                 <div className="flex justify-center items-center py-10"><Spinner /><span className="ml-2 text-gray-600 dark:text-gray-400">Loading bookings...</span></div>
              ) : bookings.length === 0 ? (
                 <div className="text-center py-10 text-gray-500 dark:text-gray-400 border border-dashed dark:border-gray-700 rounded-lg">
                     <p>No bookings found matching the current filters.</p>
                 </div>
             ) : (
                 <div className="overflow-x-auto shadow rounded-lg border dark:border-gray-700">
                     <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                         <thead className="bg-gray-50 dark:bg-gray-800">
                             {/* Table Headers */}
                             <tr>
                                 <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                                 <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Guest</th>
                                 <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Room</th>
                                 <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check-in</th>
                                 <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Check-out</th>
                                 <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                 <th scope="col" className="relative px-4 py-3"><span className="sr-only">Actions</span></th>
                             </tr>
                         </thead>
                         <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {/* Map Bookings */}
                            {bookings.map(booking => {
                                const guestName = booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : `User ID: ${booking.userId}`;
                                return (
                                    <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{booking.id}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300" title={booking.user?.email || 'Unknown Email'}>{guestName}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{booking.roomType?.name || `ID: ${booking.roomTypeId}`}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(booking.checkInDate).toLocaleDateString()}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{new Date(booking.checkOutDate).toLocaleDateString()}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                booking.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' // Default/Pending
                                            }`}>
                                                {booking.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {booking.status !== 'cancelled' && ( // Only show cancel for non-cancelled bookings
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleCancelBooking(booking.id, guestName)}
                                                    isLoading={isCancelling === booking.id}
                                                    disabled={isCancelling !== null} // Disable all while one is cancelling
                                                >
                                                    Cancel Booking
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                             })}
                         </tbody>
                     </table>
                 </div>
             )}
        </div> // <-- This closing div matches the opening one after return
    ); // <-- This closing parenthesis matches the opening one after return
}

// Helper function (ensure this is in src/lib/utils.ts and imported)
// function formatDateForAPI(date: Date | null): string | undefined { ... }