// src/components/hotels/HotelSearchForm.tsx
'use client'; // This component uses client-side hooks (useState)
//used copilot as an aid to write this code
import React, { useState } from 'react';
import { InputField } from '@/components/ui/InputField';
import { DatePicker } from '@/components/ui/DatePicker';
import { Button } from '@/components/ui/Button';
// Assuming these exist:
import RatingStarsInput from '@/components/ui/RatingStar'; // Default export
import CheckboxGroup from '@/components/ui/CheckboxGroup'; // Default export
import { cn } from '@/lib/utils';
import { HotelSearchParams } from '@/lib/api'; // Import the search params type

// --- Define available amenities (replace with fetched data if dynamic) ---
const availableAmenities = [
    { id: 'wifi', label: 'WiFi' },
    { id: 'pool', label: 'Pool' },
    { id: 'gym', label: 'Gym' },
    { id: 'parking', label: 'Parking' },
    { id: 'restaurant', label: 'Restaurant' },
    // Add more...
];

// --- Component Props ---
interface HotelSearchFormProps {
    onSearchSubmit: (searchParams: HotelSearchParams) => void;
    isLoading?: boolean; // Optional: Pass loading state from parent to disable button
    className?: string;
}

// --- Helper to format Date to YYYY-MM-DD string ---
const formatDateForAPI = (date: Date | null): string | undefined => {
    if (!date) return undefined;
    // Ensure correct local date is used, preventing timezone shifts
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


// --- The Form Component ---
 const HotelSearchForm: React.FC<HotelSearchFormProps> = ({
    onSearchSubmit,
    isLoading = false,
    className,
}) => {
    // --- State for Form Inputs ---
    const [city, setCity] = useState<string>('');
    const [checkInDate, setCheckInDate] = useState<Date | null>(null);
    const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
    const [name, setName] = useState<string>(''); // Optional: Hotel name
    const [starRating, setStarRating] = useState<number | null>(null);
    const [minPrice, setMinPrice] = useState<string>(''); // Use string for input field value
    const [maxPrice, setMaxPrice] = useState<string>('');
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]); // Store IDs/values

    // --- Handlers ---
    const handleDateChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        setCheckInDate(start);
        setCheckOutDate(end);
    };

    const handleAmenityChange = (newSelectedAmenities: string[]) => {
        setSelectedAmenities(newSelectedAmenities);
    };

     const handleRatingChange = (newRating: number | null) => {
        setStarRating(newRating);
     };


    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (checkInDate && checkOutDate && checkInDate >= checkOutDate) {
             alert("Check-out date must be after check-in date.");
             return; // Prevent submission
        }

        // --- Format data for API ---
        const searchParams: HotelSearchParams = {
            city: city || undefined, // Send undefined if empty
            checkInDate: formatDateForAPI(checkInDate),
            checkOutDate: formatDateForAPI(checkOutDate),
            name: name || undefined,
            starRating: starRating ?? undefined, // Send undefined if null
            // Convert prices to numbers, send undefined if empty or invalid
            minPrice: minPrice ? parseFloat(minPrice) : undefined,
            maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
            // Join selected amenities into comma-separated string (as API expects)
            amenities: selectedAmenities.length > 0 ? selectedAmenities.join(',') : undefined,
        };

        // Clean up undefined properties before submitting (optional but good practice)
        Object.keys(searchParams).forEach(key => {
            if (searchParams[key as keyof HotelSearchParams] === undefined) {
                delete searchParams[key as keyof HotelSearchParams];
            }
        });


        // --- Call the callback prop ---
        onSearchSubmit(searchParams);
    };

    // --- Render ---
    return (
        <form
            onSubmit={handleSubmit}
            className={cn('p-4 md:p-6 border rounded-lg bg-white dark:bg-gray-800 shadow-sm space-y-4', className)}
        >
            {/* Row 1: City and Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField
                    label="City or Destination"
                    id="city"
                    placeholder="e.g., Toronto"
                    value={city}
                    onChange={setCity}
                    required // Make city mandatory for search
                />
                <div className="md:col-span-2">
                     <label htmlFor="dates" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Check-in - Check-out
                    </label>
                    <DatePicker
                        isRange={true}
                        startDate={checkInDate}
                        endDate={checkOutDate}
                        onChange={handleDateChange}
                        placeholderText="Select Dates"
                        // You might want to add minDate={new Date()}
                    />
                </div>
            </div>

            {/* Row 2: Filters (Optional Name, Rating, Price) */}
             <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <InputField
                    label="Hotel Name (Optional)"
                    id="hotelName"
                    placeholder="Enter hotel name"
                    value={name}
                    onChange={setName}
                />
                 <div>
                    <label htmlFor="rating" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Min Rating
                    </label>
                    {/* Use RatingStarsInput if available, otherwise fallback */}
                    <RatingStarsInput rating={starRating ?? 0} onChange={handleRatingChange} />
                    {/* Fallback to simple input if RatingStarsInput not ready: */}
                    {/* <InputField type="number" id="rating" min="1" max="5" step="0.5" value={starRating ?? ''} onChange={e => setStarRating(e.target.value ? parseFloat(e.target.value) : null)} placeholder="Any" /> */}
                </div>
                <InputField
                    label="Min Price / Night ($)"
                    id="minPrice"
                    type="number"
                    min="0"
                    placeholder="Any"
                    value={minPrice}
                    onChange={setMinPrice}
                />
                <InputField
                    label="Max Price / Night ($)"
                    id="maxPrice"
                    type="number"
                    min="0"
                    placeholder="Any"
                    value={maxPrice}
                    onChange={setMaxPrice}
                />
            </div>

            {/* Row 3: Amenities Filter */}
            <div className="pt-2">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Amenities
                </label>
                 {/* Using CheckboxGroup with the correct props */}
                 <CheckboxGroup
                    options={availableAmenities}
                    selectedValues={selectedAmenities}
                    onChange={handleAmenityChange}
                 />
                 {/* Fallback if CheckboxGroup not ready:
                 <p className="text-xs text-gray-400">(Amenity filter component placeholder)</p>
                 */}
            </div>


            {/* Row 4: Submit Button */}
            <div className="flex justify-end pt-4">
                <Button type="submit" isLoading={isLoading} disabled={isLoading}>
                    Search Hotels
                </Button>
            </div>
        </form>
    );
};

export default HotelSearchForm;