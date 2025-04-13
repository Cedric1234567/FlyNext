// src/components/hotels/HotelManagementForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hotel, HotelCreateData, HotelUpdateData } from '@/types'; // Import relevant types
import { InputField } from '@/components/ui/InputField'; // Use your InputField
import { Button } from '@/components/ui/Button'; // Use your Button
import RatingStarsInput from '@/components/ui/RatingStar'; // Use your Rating Input
import { createHotel, updateHotel } from '@/lib/api'; // Import API functions
import { HTTPError } from '@/lib/api';
import { cn } from '@/lib/utils';

interface HotelManagementFormProps {
    initialData?: Hotel | null; // Pass existing hotel data for editing mode
    // Callback can signal success to parent (e.g., close modal, refresh list)
    onSubmitSuccess?: (updatedHotel: Hotel) => void;
    className?: string;
}

export default function HotelManagementForm({
    initialData = null,
    onSubmitSuccess,
    className
}: HotelManagementFormProps) {
    const router = useRouter();
    const isEditing = Boolean(initialData?.id); // Determine mode based on initialData having an ID

    // Form State
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [location, setLocation] = useState('');
    const [starRating, setStarRating] = useState<number | null>(null);
    // State for comma-separated image URLs in the textarea
    const [logoUrl, setLogoUrl] = useState('');
    const [imagesString, setImagesString] = useState('');

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // --- Effect to pre-fill form when in editing mode ---
    useEffect(() => {
        if (isEditing && initialData) {
            console.log("HotelManagementForm: Pre-filling with initialData", initialData);
            setName(initialData.name || '');
            setAddress(initialData.address || '');
            setLocation(initialData.location || '');
            setLogoUrl(initialData.logoUrl || ''); 
            // Handle null rating correctly, default to null if undefined/null
            setStarRating(initialData.starRating ?? null);
            // Join the image URL array (if it exists) into a comma-separated string for the textarea
            setImagesString(Array.isArray(initialData.images) ? initialData.images.join(', ') : '');
        } else {
            // setLogoUrl(''); 
             // Optionally reset form if initialData changes to null (e.g. closing modal)
             // Or rely on parent component unmounting/remounting the form
        }
    }, [initialData, isEditing]); // Rerun if initialData changes

    // Generic input handler using field name (assumes InputField onChange provides value string)
    const handleInputChange = (fieldName: keyof typeof stateForInputs) => (value: string) => {
        // Helper object to map state setters - prevents large switch/if-else
        const stateSetters = {
            name: setName,
            address: setAddress,
            location: setLocation,
            imagesString: setImagesString,
            logoUrl: setLogoUrl,
        };
        if (stateSetters[fieldName as keyof typeof stateSetters]) {
             stateSetters[fieldName as keyof typeof stateSetters](value);
        }
    };
     // Need separate state object for the helper above to work with keys
     const stateForInputs = { name, address, location, imagesString, logoUrl };

    // Handler specifically for RatingStarsInput (assuming it returns number | null)
    const handleRatingChange = (newRating: number | null) => {
        setStarRating(newRating);
    };

    // Handler for the image textarea
    const handleImagesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setImagesString(e.target.value);
    };


    // --- Form Submission ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // 1. Prepare Data: Parse images string
        const images = imagesString
            .split(',')                 // Split by comma
            .map(url => url.trim())     // Remove whitespace around each URL
            .filter(url => url !== ''); // Remove any empty strings resulting from multiple commas etc.

        // 2. Construct Payload (ensure types match HotelCreateData/HotelUpdateData)
        const payload = {
            name,
            address,
            location,
            starRating: starRating === null ? null : Number(starRating), // Ensure null or number
            images, // The parsed array of URLs
            logoUrl: logoUrl.trim() || null,
        };

        try {
            let result: Hotel;
            if (isEditing && initialData?.id) {
                // Call updateHotel API
                console.log(`Updating Hotel ${initialData.id} with payload:`, payload);
                // Explicitly cast payload type for update
                result = await updateHotel(initialData.id, payload as HotelUpdateData);
                console.log("Update successful:", result);
                alert('Hotel updated successfully!'); // Provide user feedback
            } else {
                // Call createHotel API
                console.log("Creating new hotel with payload:", payload);
                 // Explicitly cast payload type for create
                result = await createHotel(payload as HotelCreateData);
                console.log("Create successful:", result);
                alert('Hotel created successfully!');
            }

            // 3. Handle Success (Callback or Redirect)
            if (onSubmitSuccess) {
                onSubmitSuccess(result); // Call parent callback if provided
            } else {
                // Default behavior: redirect back to the list page
                router.push('/manage-hotels');
            }

        } catch (err: any) {
            console.error("Failed to save hotel:", err);
            // Extract error message from HTTPError or generic error
            setError(err instanceof HTTPError ? (err.info?.error || err.message) : (err.message || 'An unexpected error occurred.'));
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render Form ---
    return (
        <form onSubmit={handleSubmit} className={cn("space-y-5", className)}>
            {/* Title changes based on mode */}
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white border-b pb-3 dark:border-gray-700">
                {isEditing ? 'Edit Hotel Details' : 'Add New Hotel'}
            </h2>

            {/* Input Fields */}
            <InputField label="Hotel Name" id="hotel-name" name="name" value={name} onChange={handleInputChange('name')} required />
            <InputField label="Address" id="hotel-address" name="address" value={address} onChange={handleInputChange('address')} required />
            <InputField label="City / Location" id="hotel-location" name="location" value={location} onChange={handleInputChange('location')} required placeholder="e.g., Toronto" />

                        {/* *** ADD InputField for Logo URL *** */}
            <InputField
                label="Logo URL (Optional)"
                id="hotel-logo"
                name="logoUrl" // Matches state key
                type="url" // Use URL type for basic browser validation
                value={logoUrl}
                onChange={handleInputChange('logoUrl')} // Use handler
                placeholder="https://example.com/logo.png"
            />

            {/* Rating Input */}
            <div>
                <label htmlFor="hotel-rating" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Star Rating (Optional, 1-5)
                </label>
                <RatingStarsInput id="hotel-rating" rating={starRating} onChange={handleRatingChange} />
                {/* Fallback number input if needed:
                <InputField type="number" id="hotel-rating" name="starRating" value={starRating ?? ''} onChange={(val) => setStarRating(val ? parseFloat(val) : null)} min="1" max="5" step="0.5" placeholder="e.g., 4.5" /> */}
            </div>

            {/* Image URLs Textarea */}
            <div>
                 <label htmlFor="hotel-images" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                     Image URLs (comma-separated)
                 </label>
                 <textarea
                    id="hotel-images"
                    name="imagesString" // Matches state variable name
                    value={imagesString}
                    onChange={handleImagesChange}
                    rows={4}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.png, ..."
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Paste publicly accessible image URLs separated by commas.</p>
            </div>

            {/* Error Display */}
            {error && <p className="text-red-500 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/30 rounded border border-red-200 dark:border-red-700/50">{error}</p>}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-3">
                 {isEditing && ( // Show cancel button only when editing
                     <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isLoading}>
                         Cancel
                     </Button>
                 )}
                <Button type="submit" isLoading={isLoading} disabled={isLoading}>
                    {isEditing ? 'Save Changes' : 'Create Hotel'}
                </Button>
            </div>
        </form>
    );
}