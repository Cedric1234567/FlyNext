/**
* This code was generated with the help of ChatGPT/GenAI and it was modified a bit to meet
* the speciifc requirement and standards. The prompt given was the hotels user story
* from the assignment.
*/

// src/app/(main)/manage-hotels/[hotelId]/manage-rooms/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth'; // Use auth guard
import { getHotelById, deleteRoomType } from '@/lib/api'; // Import API functions
import { Hotel, RoomType } from '@/types'; // Import types
import Spinner from '@/components/ui/Spinner'; // Import Spinner
import { Button } from '@/components/ui/Button'; // Import Button
import RoomTypeForm from '@/components/hotels/RoomTypeForm'; // Import the form
import RoomAvailabilityView from '@/components/hotels/RoomAvailabilityView'; // <-- Import Availability View
import { HTTPError } from '@/lib/api'; // Import error type

export default function ManageHotelRoomsPage() {
    // Authentication and Routing
    const { user, isLoading: isAuthLoading } = useRequireAuth();
    const router = useRouter(); // Keep for potential future use
    const params = useParams();
    const hotelIdParam = Array.isArray(params.hotelId) ? params.hotelId[0] : params.hotelId;
    const hotelId = hotelIdParam ? parseInt(hotelIdParam, 10) : NaN; // Parse hotelId safely

    // State Management
    const [hotelData, setHotelData] = useState<Hotel | null>(null); // Holds fetched hotel + room data
    const [isLoadingPage, setIsLoadingPage] = useState(true); // Loading state for initial fetch
    const [pageError, setPageError] = useState<string | null>(null); // Page-level errors

    // State for the Add/Edit Form
    const [isFormVisible, setIsFormVisible] = useState(false); // Toggle inline form visibility
    const [editingRoomType, setEditingRoomType] = useState<RoomType | null>(null); // Holds data for editing

    // State for Deletion action
    const [isDeletingRoom, setIsDeletingRoom] = useState<number | null>(null); // Store ID of room being deleted

    // --- Data Fetching ---
    const fetchHotelData = useCallback(async () => {
        // Guard clauses: Ensure valid ID and authenticated user
        if (isNaN(hotelId) || !user) {
            if (!isNaN(hotelId)) setIsLoadingPage(false); // Stop loading if ID was valid but no user
            if (isNaN(hotelId)) setPageError("Invalid Hotel ID specified in the URL.");
            return; // Exit if conditions not met
        }

        setIsLoadingPage(true);
        setPageError(null); // Clear previous errors on new fetch
        console.log(`ManageRooms: Fetching hotel ${hotelId} data including rooms...`);

        try {
            // Fetch hotel data using the API function
            // No specific dates needed here for editing rooms, just base hotel info + rooms
            const responseData = await getHotelById(hotelId);
            const fetchedHotel = responseData?.hotel; // Extract nested hotel object

            if (!fetchedHotel) {
                throw new Error(`Hotel with ID ${hotelId} not found.`);
            }
            // Perform client-side ownership check for immediate feedback
            if (fetchedHotel.ownerId !== user.id) {
                throw new Error("You do not have permission to manage rooms for this hotel.");
            }

            setHotelData(fetchedHotel); // Store fetched data

        } catch (err: any) {
            console.error("Failed to fetch hotel data for room management:", err);
            setPageError(err instanceof HTTPError ? (err.info?.error || err.message) : (err.message || 'Could not load hotel data.'));
            setHotelData(null); // Clear data on error
        } finally {
            setIsLoadingPage(false);
        }
    }, [hotelId, user]); // Dependencies for the fetch function

    // Effect to trigger initial data fetch when auth is ready
    useEffect(() => {
        if (!isAuthLoading && user) {
            fetchHotelData(); // Fetch data once auth is loaded and user exists
        } else if (!isAuthLoading && !user) {
            // Handled by useRequireAuth redirect, just ensure loading stops
            setIsLoadingPage(false);
        }
        // If hotelId is initially NaN, error state will be set by fetchHotelData's guard
    }, [isAuthLoading, user, fetchHotelData]); // Run when auth state changes


    // --- Action Handlers ---

    // Show the form for adding a new room
    const openAddForm = () => {
        setEditingRoomType(null); // Ensure no initial data
        setIsFormVisible(true);
    };

    // Show the form pre-filled for editing an existing room
    const openEditForm = (roomType: RoomType) => {
        setEditingRoomType(roomType); // Set the room data to edit
        setIsFormVisible(true);
    };

    // Called by RoomTypeForm upon successful save (create or update)
    const handleFormSuccess = (/*savedRoomType: RoomType*/) => {
        setIsFormVisible(false); // Hide the form
        setEditingRoomType(null); // Clear editing state
        fetchHotelData(); // Refresh the list of rooms
    };

    // Called by RoomTypeForm's Cancel button
    const handleCancelForm = () => {
        setIsFormVisible(false); // Hide the form
        setEditingRoomType(null); // Clear editing state
    };

    // Handler for deleting a room type
    const handleDeleteRoom = async (roomTypeId: number, roomName: string) => {
        // Prevent multiple delete actions simultaneously
        if (isDeletingRoom !== null) return;

        if (window.confirm(`Are you sure you want to delete the room type "${roomName}"? This action cannot be undone and will delete associated bookings.`)) {
            setIsDeletingRoom(roomTypeId); // Set loading state for the specific delete button
            setPageError(null); // Clear previous errors
            try {
                // Call the API function (backend handles auth/ownership)
                await deleteRoomType(hotelId, roomTypeId);
                alert("Room type deleted successfully.");
                fetchHotelData(); // Refresh the room list
            } catch (err: any) {
                console.error(`Failed to delete room type ${roomTypeId}:`, err);
                setPageError(err instanceof HTTPError ? (err.info?.error || err.message) : (err.message || 'Could not delete room type.'));
            } finally {
                setIsDeletingRoom(null); // Clear deleting indicator regardless of outcome
            }
        }
    };

    // --- Render Logic ---

    // 1. Handle Auth Loading
    if (isAuthLoading) {
        return <div className="flex justify-center items-center min-h-[300px]"><Spinner /><span className="ml-3">Loading...</span></div>;
    }
    // 2. Handle No User (Redirect should occur via useRequireAuth)
    if (!user) {
        return <div className="p-4 text-center">Loading session or redirecting...</div>;
    }
    // 3. Handle Page Level Errors (Invalid ID, Fetch Error, Permission Error)
    if (pageError) {
        return (
            <div className="text-center py-10 px-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg max-w-lg mx-auto">
                 <p className="font-semibold text-red-700 dark:text-red-300 text-lg">Error</p>
                 <p className="mt-1 text-sm text-red-600 dark:text-red-400">{pageError}</p>
                 <Link href={isNaN(hotelId) ? '/manage-hotels' : `/manage-hotels/${hotelId}`}>
                     <Button variant="link" className="mt-4">Back to Hotel</Button>
                 </Link>
            </div>
        );
    }
    // 4. Handle Page Content Loading State (Initial fetch or refetch)
     if (isLoadingPage || !hotelData) {
        return <div className="flex justify-center items-center min-h-[300px]"><Spinner /><span className="ml-3">Loading Room Data...</span></div>;
     }

    // --- 5. Main Content Render (User Authenticated, Hotel Data Loaded) ---
    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header and Add Button */}
            <div className="flex flex-wrap justify-between items-center gap-4 border-b pb-4 mb-6 dark:border-gray-700">
                 <div>
                     {/* Link back to the main edit page for this hotel */}
                     <Link href={`/manage-hotels/${hotelId}`} className="text-sm text-blue-600 hover:underline dark:text-blue-400">← Back to Edit Hotel Details</Link>
                     <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                        Manage Rooms: <span className='font-medium'>{hotelData.name}</span>
                     </h1>
                 </div>
                 {/* Show Add button only when form is not visible */}
                {!isFormVisible && <Button onClick={openAddForm} data-testid="add-room-button">+ Add New Room Type</Button>}
            </div>

             {/* --- ADDED: Availability Checker Section --- */}
              <section>
                 <RoomAvailabilityView hotelId={hotelId} />
              </section>
              {/* --- End Availability Checker Section --- */}

            {/* Add/Edit Room Form Section (Conditionally Rendered) */}
            <section id="room-type-form-section" className={isFormVisible ? 'block mt-6' : 'hidden'}> {/* Added mt-6 when visible */}
                 <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 border dark:border-gray-700 rounded-lg shadow-md mb-6">
                    {/* Form is rendered here when isFormVisible is true */}
                    <RoomTypeForm
                        hotelId={hotelId}
                        initialData={editingRoomType} // Will be null for add, populated for edit
                        onSubmitSuccess={handleFormSuccess}
                        onCancel={handleCancelForm} // Pass cancel handler
                    />
                </div>
                 {/* Optional separator */}
                 {isFormVisible && <hr className="my-6 border-gray-300 dark:border-gray-600"/>}
            </section>


            {/* Room Type List Section */}
            <section aria-labelledby="room-list-heading">
                 <h2 id="room-list-heading" className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Existing Room Types
                </h2>
                {/* Check specifically for roomTypes array presence */}
                {!hotelData.roomTypes ? (
                     <div className="text-center py-10 text-gray-500 dark:text-gray-400 border border-dashed dark:border-gray-700 rounded-lg">
                         <p>Could not load room types for this hotel.</p>
                     </div>
                ) : hotelData.roomTypes.length === 0 ? (
                    // Handle case where hotel exists but has no rooms yet
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400 border border-dashed dark:border-gray-700 rounded-lg">
                        <p className="text-lg font-medium">No Room Types Found.</p>
                        <p className="mt-2">Add the first room type for this hotel.</p>
                        {/* Show Add button here too if form isn't already visible */}
                        {!isFormVisible && <Button variant="secondary" size="sm" onClick={openAddForm} className="mt-3">Add Room Type</Button>}
                    </div>
                ) : (
                    // Render the list if rooms exist
                    <div className="space-y-4">
                        {hotelData.roomTypes.map(room => (
                            <div key={room.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                                {/* Room Info */}
                                <div className="flex-grow min-w-0"> {/* Added min-w-0 */}
                                    <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate" title={room.name}>{room.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        ${room.pricePerNight.toFixed(2)} / night • {room.availableRooms} room(s) available
                                    </p>
                                    {/* Display first few amenities */}
                                    {room.amenities && room.amenities.length > 0 && (
                                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate" title={room.amenities.join(', ')}>
                                            Amenities: {room.amenities.slice(0, 4).join(', ')}{room.amenities.length > 4 ? '...' : ''}
                                        </p>
                                    )}
                                </div>
                                {/* Actions */}
                                <div className="flex flex-shrink-0 gap-2 mt-2 md:mt-0">
                                    {/* Disable Edit/Delete if the form is visible */}
                                    <Button variant="outline" size="sm" onClick={() => openEditForm(room)} disabled={isFormVisible}>Edit</Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteRoom(room.id, room.name)}
                                        isLoading={isDeletingRoom === room.id}
                                        disabled={isDeletingRoom !== null || isFormVisible} // Disable if any delete is happening or form is open
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}

