// src/components/hotels/RoomTypeForm.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { RoomType, RoomTypeCreateData, RoomTypeUpdateData } from '@/types';
import { InputField } from '@/components/ui/InputField';
import { Button } from '@/components/ui/Button';
import { createRoomType, updateRoomType } from '@/lib/api'; // Import API functions
import { HTTPError } from '@/lib/api';
import { cn } from '@/lib/utils';

interface RoomTypeFormProps {
    hotelId: number; // ID of the hotel this room belongs to
    initialData?: RoomType | null; // Pass existing data for editing
    onSubmitSuccess?: (roomType: RoomType) => void; // Callback on success (e.g., close modal)
    onCancel?: () => void; // Callback for cancel button
    className?: string;
}

export default function RoomTypeForm({
    hotelId,
    initialData = null,
    onSubmitSuccess,
    onCancel,
    className
}: RoomTypeFormProps) {
    const isEditing = Boolean(initialData?.id);

    // Form State
    const [name, setName] = useState('');
    const [pricePerNight, setPricePerNight] = useState(''); // Use string for input
    const [availableRooms, setAvailableRooms] = useState(''); // Use string for input
    const [amenitiesString, setAmenitiesString] = useState(''); // Comma-separated
    const [imagesString, setImagesString] = useState(''); // Comma-separated URLs

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Pre-fill form if editing
    useEffect(() => {
        if (isEditing && initialData) {
            setName(initialData.name || '');
            setPricePerNight(String(initialData.pricePerNight ?? '')); // Convert to string
            setAvailableRooms(String(initialData.availableRooms ?? '')); // Convert to string
            setAmenitiesString(Array.isArray(initialData.amenities) ? initialData.amenities.join(', ') : '');
            setImagesString(Array.isArray(initialData.images) ? initialData.images.join(', ') : '');
        } else {
             // Reset form for adding or if initialData is removed
              setName(''); setPricePerNight(''); setAvailableRooms('');
              setAmenitiesString(''); setImagesString('');
        }
    }, [initialData, isEditing]);

    // Input Handlers using helper function approach
     const handleInputChange = (fieldName: keyof typeof stateForInputs) => (value: string) => {
        const stateSetters = { name: setName, pricePerNight: setPricePerNight, availableRooms: setAvailableRooms };
        if (stateSetters[fieldName as keyof typeof stateSetters]) {
             stateSetters[fieldName as keyof typeof stateSetters](value);
        }
    };
     const stateForInputs = { name, pricePerNight, availableRooms }; // For helper typing

     const handleTextAreaChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
         setter(e.target.value);
     };


    // --- Form Submission ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // --- Data Validation & Preparation ---
        const price = parseFloat(pricePerNight);
        const rooms = parseInt(availableRooms, 10); // Use parseInt for whole rooms

        if (isNaN(price) || price < 0) {
            setError("Please enter a valid non-negative price per night.");
            setIsLoading(false);
            return;
        }
        if (isNaN(rooms) || rooms < 0) {
            setError("Please enter a valid non-negative number for available rooms.");
            setIsLoading(false);
            return;
        }

        const amenities = amenitiesString.split(',').map(a => a.trim()).filter(Boolean);
        const images = imagesString.split(',').map(url => url.trim()).filter(Boolean);

        const payload = {
            name,
            pricePerNight: price,
            availableRooms: rooms,
            amenities,
            images,
        };

        try {
            let result: RoomType;
            if (isEditing && initialData?.id) {
                // Call updateRoomType API function
                 console.log(`Updating Room Type ${initialData.id} for Hotel ${hotelId} with:`, payload);
                result = await updateRoomType(hotelId, initialData.id, payload as RoomTypeUpdateData);
                alert('Room type updated successfully!');
            } else {
                // Call createRoomType API function
                 console.log(`Creating Room Type for Hotel ${hotelId} with:`, payload);
                result = await createRoomType(hotelId, payload as RoomTypeCreateData);
                 alert('Room type created successfully!');
            }

            // Call success callback (likely closes modal and refetches list)
            if (onSubmitSuccess) {
                onSubmitSuccess(result);
            }

        } catch (err: any) {
            console.error("Failed to save room type:", err);
            setError(err instanceof HTTPError ? (err.info?.error || err.message) : (err.message || 'An unexpected error occurred.'));
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render Form ---
    return (
        <form onSubmit={handleSubmit} className={cn("space-y-4 p-1", className)}> {/* Reduced padding for modal */}
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {isEditing ? 'Edit Room Type' : 'Add New Room Type'}
            </h3>

            <InputField label="Room Name" id="room-name" name="name" value={name} onChange={handleInputChange('name')} required placeholder="e.g., Deluxe King Suite" />
            <div className="grid grid-cols-2 gap-4">
                 <InputField label="Price Per Night ($)" id="room-price" name="pricePerNight" type="number" step="0.01" min="0" value={pricePerNight} onChange={handleInputChange('pricePerNight')} required placeholder="e.g., 199.99" />
                 <InputField label="Available Rooms" id="room-available" name="availableRooms" type="number" min="0" step="1" value={availableRooms} onChange={handleInputChange('availableRooms')} required placeholder="e.g., 5" />
            </div>
             <div>
                 <label htmlFor="room-amenities" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amenities (comma-separated)</label>
                 <textarea id="room-amenities" name="amenitiesString" value={amenitiesString} onChange={handleTextAreaChange(setAmenitiesString)} rows={2} className="mt-1 block w-full input-styling" placeholder="WiFi, Air Conditioning, Mini Bar..."/>
             </div>
             <div>
                 <label htmlFor="room-images" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Image URLs (comma-separated)</label>
                 <textarea id="room-images" name="imagesString" value={imagesString} onChange={handleTextAreaChange(setImagesString)} rows={3} className="mt-1 block w-full input-styling" placeholder="https://example.com/room1.jpg, ..."/>
                 <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Paste image URLs separated by commas.</p>
             </div>

            {error && <p className="text-red-500 dark:text-red-400 text-sm">{error}</p>}

            <div className="flex justify-end space-x-3 pt-2">
                <Button type="button" variant="secondary" onClick={onCancel} disabled={isLoading}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={isLoading} disabled={isLoading}>
                    {isEditing ? 'Save Room Type' : 'Add Room Type'}
                </Button>
            </div>
        </form>
    );
}

// Add common input styling class for textareas if needed
// Add to globals.css or define here:
// .input-styling { @apply px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white; }