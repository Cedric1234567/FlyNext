// src/components/hotels/RoomAvailabilityView.tsx
// Used Copilot while writing this code
"use client";

import React, { useState } from 'react';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import { checkRoomAvailability } from '@/lib/api'; // Import API function
import { RoomAvailabilityInfo } from '@/types'; // Import type
import { formatDateForAPI } from '@/lib/utils'; // Import date formatter
import { HTTPError } from '@/lib/api';

interface RoomAvailabilityViewProps {
    hotelId: number; // ID of the hotel to check
}

const RoomAvailabilityView: React.FC<RoomAvailabilityViewProps> = ({ hotelId }) => {
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [availabilityData, setAvailabilityData] = useState<RoomAvailabilityInfo[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDateChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
         // Basic validation on selection
         if (start && end && start >= end) {
             setStartDate(start);
             setEndDate(null); // Clear end date if invalid range selected
         } else {
             setStartDate(start);
             setEndDate(end);
         }
         // Clear previous results when dates change before search is clicked
         setAvailabilityData(null);
         setError(null);
    };

    const handleCheckAvailability = async () => {
        if (!startDate || !endDate) {
            setError("Please select both a start and end date.");
            return;
        }
        if (startDate >= endDate) {
             setError("End date must be after start date.");
             return;
        }

        setError(null);
        setIsLoading(true);
        setAvailabilityData(null); // Clear previous results

        const startStr = formatDateForAPI(startDate);
        const endStr = formatDateForAPI(endDate);

        if (!startStr || !endStr) { // Should not happen if dates are set, but safety check
             setError("Invalid date format somehow.");
             setIsLoading(false);
             return;
        }

        try {
            const results = await checkRoomAvailability(hotelId, startStr, endStr);
            setAvailabilityData(results || []); // Set results (ensure array even if API returns null)
        } catch (err: any) {
            console.error("Failed to check availability:", err);
            setError(err instanceof HTTPError ? (err.info?.error || err.message) : (err.message || 'Could not check availability.'));
            setAvailabilityData(null); // Clear results on error
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Check Room Availability</h3>
            {/* Date Selection */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                <div className='flex-grow'>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Select Date Range</label>
                    <DatePicker
                        isRange={true}
                        startDate={startDate}
                        endDate={endDate}
                        onChange={handleDateChange}
                        placeholderText="Start Date - End Date"
                        min={new Date().toISOString().split('T')[0]} // Format today as YYYY-MM-DD string
                    />
                </div>
                <div className="flex-shrink-0">
                    <Button onClick={handleCheckAvailability} isLoading={isLoading} disabled={!startDate || !endDate || isLoading}>
                        Check Availability
                    </Button>
                </div>
            </div>

            {/* Results Area */}
            {isLoading && (
                 <div className="flex justify-center items-center py-4"><Spinner /><span className="ml-2 text-sm">Checking...</span></div>
            )}
            {error && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>
            )}
            {availabilityData !== null && !isLoading && !error && ( // Show results only after successful fetch
                <div className="mt-4 space-y-2 pt-4 border-t dark:border-gray-600">
                    {availabilityData.length === 0 ? (
                         <p className="text-sm text-center text-gray-500 dark:text-gray-400">No room types found for this hotel.</p>
                    ) : (
                         <ul className="divide-y dark:divide-gray-600">
                             {availabilityData.map(room => (
                                 <li key={room.roomTypeId} className="py-2 flex justify-between items-center text-sm">
                                     <span className="font-medium text-gray-800 dark:text-gray-200">{room.roomTypeName}</span>
                                     <span className={room.remainingRooms > 0 ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-red-600 dark:text-red-400'}>
                                         {room.remainingRooms} available
                                     </span>
                                 </li>
                             ))}
                         </ul>
                    )}
                 </div>
            )}
        </div>
    );
};

export default RoomAvailabilityView;