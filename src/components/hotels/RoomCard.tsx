// src/components/hotels/RoomCard.tsx
'use client'; // May use client hooks or event handlers

import React, { useState } from 'react';
import Image from 'next/image';
import { RoomType } from '@/types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
// Optional icons for amenities

interface RoomCardProps {
    roomType: RoomType;
    hotelId: number;
    // Dates are needed to know if the 'Select' button should be enabled/disabled
    // and potentially passed along when selecting the room
    checkInDate: Date | null;
    checkOutDate: Date | null;
    // Callback function when the user selects this room
    // Parent component will handle adding to itinerary/context
    onSelectRoom?: (details: { hotelId: number; roomTypeId: number; checkInDate: Date; checkOutDate: Date; pricePerNight: number }) => void;
    className?: string;
}

const RoomCard: React.FC<RoomCardProps> = ({
    roomType,
    hotelId,
    checkInDate,
    checkOutDate,
    onSelectRoom,
    className,
}) => {
    // Determine if the room can be selected based on dates and availability
    const canSelect = Boolean(checkInDate && checkOutDate && (roomType.effectiveAvailability ?? roomType.availableRooms) > 0);
    // Use effectiveAvailability if present (meaning dates were provided for calculation),
    // otherwise fallback to the base availableRooms count.
    const displayAvailability = roomType.effectiveAvailability ?? roomType.availableRooms;

    // Simple image cycling or just show the first one
    const images = roomType.images && Array.isArray(roomType.images) && roomType.images.length > 0
        ? roomType.images
        : ['/placeholder-room.png']; // Fallback image
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const currentImageUrl = images[currentImageIndex];

    const handleNextImage = (e: React.MouseEvent) => {
         e.stopPropagation(); // Prevent card click/link if needed
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }
    const handlePrevImage = (e: React.MouseEvent) => {
         e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
    }


    const handleSelectClick = () => {
        if (canSelect && onSelectRoom && checkInDate && checkOutDate) {
            onSelectRoom({
                hotelId,
                roomTypeId: roomType.id,
                checkInDate,
                checkOutDate,
                pricePerNight: roomType.pricePerNight
            });
        } else {
            // Optionally provide feedback if selection is disabled
            console.warn("Cannot select room: Dates not selected or room not available.");
            // Or show an alert/toast
        }
    };

    return (
        <div
            className={cn(
                'border dark:border-gray-700 rounded-lg overflow-hidden shadow-sm bg-white dark:bg-gray-800 flex flex-col sm:flex-row', // Flex row on small screens and up
                className
            )}
        >
            {/* Image Section */}
            <div className="relative w-full sm:w-1/3 md:w-1/4 h-48 sm:h-auto flex-shrink-0">
                <img
                    key={currentImageUrl} // Re-render if URL changes
                    src={currentImageUrl}
                    alt={`Image of ${roomType.name}`}
                    // fill prop removed - not valid on standard img tag
                    // sizes attribute removed - not needed for standard img
                    className="w-full h-full object-cover" // Added proper styling for img
                    onError={(e) => {
                        const imgElement = e.currentTarget as HTMLImageElement;
                        imgElement.src = '/placeholder-room.png';
                        imgElement.srcset = '';
                    }}
                />
                {/* Image Navigation Buttons (optional) */}
                {images.length > 1 && (
                    <>
                        <button
                            onClick={handlePrevImage}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full z-10 transition-opacity opacity-70 hover:opacity-100"
                            aria-label="Previous image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <button
                            onClick={handleNextImage}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full z-10 transition-opacity opacity-70 hover:opacity-100"
                            aria-label="Next image"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    </>
                )}
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col flex-grow justify-between">
                <div> {/* Top part of content */}
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {roomType.name}
                    </h4>

                    {/* Amenities */}
                    {roomType.amenities && roomType.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3 text-xs text-gray-700 dark:text-gray-300">
                            {roomType.amenities.map((amenity) => (
                                <span key={amenity} className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                    {/* Optional: Add icons based on amenity text */}
                                    {amenity}
                                </span>
                            ))}
                        </div>
                    )}

                     {/* Display Availability */}
                     <p className={cn(
                         "text-sm mb-3",
                         displayAvailability > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                     )}>
                         {displayAvailability > 0 ? `${displayAvailability} room${displayAvailability > 1 ? 's' : ''} available` : 'Not available for selected dates'}
                         {!checkInDate && !checkOutDate && ` (Select dates to confirm)`}
                    </p>

                </div>

                <div> {/* Bottom part of content */}
                    {/* Price */}
                    <p className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                        ${roomType.pricePerNight.toFixed(2)}
                        <span className="text-sm font-normal text-gray-500 dark:text-gray-400"> / night</span>
                    </p>

                    {/* Select Button */}
                    <Button
                        className="w-full sm:w-auto"
                        onClick={handleSelectClick}
                        disabled={!canSelect || !onSelectRoom} // Disable if dates not selected, not available, or no callback provided
                        aria-label={`Select ${roomType.name} for $${roomType.pricePerNight.toFixed(2)} per night`}
                    >
                        Select Room
                    </Button>
                    {!checkInDate || !checkOutDate && (
                         <p className="text-xs text-center sm:text-left text-gray-500 dark:text-gray-400 mt-1">Select check-in/out dates to enable selection.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RoomCard;