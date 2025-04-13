// src/components/hotels/HotelDetailsView.tsx
import React, { useState, useEffect } from 'react';
// *** REMOVED: import Image from 'next/image'; ***
import { Hotel } from '@/types';
import RatingStarsDisplay from '@/components/ui/RatingStar'; // Use your display component
import { cn } from '@/lib/utils';
// Optional: Import icons if needed (e.g., for address)
// import { MapPin } from 'lucide-react';
// Optional: Import MapView if ready
// import MapView from '@/components/ui/MapView';

interface HotelDetailsViewProps {
    hotel: Hotel;
}

const HotelDetailsView: React.FC<HotelDetailsViewProps> = ({ hotel }) => {
    // Fallback for images - ensure it's always an array
    const imagesFromProps = (Array.isArray(hotel.images) && hotel.images.length > 0) ? hotel.images : ['/placeholder-hotel.png'];

    // State to manage which image URL is currently displayed large
    const [mainImageUrl, setMainImageUrl] = useState<string>(imagesFromProps[0]);

    // Effect to reset main image if hotel prop changes (e.g., navigating between hotels)
    useEffect(() => {
        const newImages = (Array.isArray(hotel.images) && hotel.images.length > 0) ? hotel.images : ['/placeholder-hotel.png'];
        setMainImageUrl(newImages[0]); // Set to first image of the *new* hotel prop
    }, [hotel]); // Dependency on the hotel prop object

    // Function to safely handle image errors and set placeholder
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, urlTried: string) => {
        const imgElement = e.currentTarget as HTMLImageElement;
        console.warn(`Failed to load image: ${urlTried}. Falling back to placeholder.`);
        // Prevent potential infinite loop if placeholder itself fails
        if (imgElement.src !== '/placeholder-hotel.png') {
            imgElement.src = '/placeholder-hotel.png';
            imgElement.srcset = ''; // Clear srcset as well
            // If this was the main image, update state too
            if (urlTried === mainImageUrl) {
                 setMainImageUrl('/placeholder-hotel.png');
            }
             // Optionally add a class to visually indicate fallback
            imgElement.classList.add('img-error-fallback');
        } else {
             // If placeholder itself fails, maybe hide the element entirely
             imgElement.style.display = 'none';
        }
    };


    return (
        <section aria-labelledby="hotel-details-heading" className="space-y-6">
            {/* Header: Name and Rating */}
            <div className="pb-4 border-b dark:border-gray-700">
                <h1 id="hotel-details-heading" className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                    {hotel.name}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {hotel.starRating && (
                         <RatingStarsDisplay rating={hotel.starRating} />
                    )}
                    <span className="flex items-center">
                        📍 {hotel.address}, {hotel.location}
                    </span>
                </div>
            </div>

            {/* Image Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Main Image Display */}
                <div className="md:col-span-2 relative w-full aspect-[16/10] rounded-lg overflow-hidden shadow-md bg-gray-100 dark:bg-gray-700"> {/* Added background color */}
                     {/* *** USE STANDARD <img> TAG *** */}
                     <img
                        key={mainImageUrl} // Use URL as key to help React swap if URL changes drastically
                        src={mainImageUrl} // Use state variable
                        alt={`Main image of ${hotel.name}`}
                        loading="eager" // Load main image eagerly (potentially 'lazy' if below fold)
                        className="absolute inset-0 w-full h-full object-cover" // Use absolute positioning to fill parent
                        onError={(e) => handleImageError(e, mainImageUrl)} // Use error handler
                    />
                </div>

                {/* Thumbnails (if more than one actual image) */}
                {/* Filter out the placeholder before checking length */}
                {imagesFromProps.filter(url => url !== '/placeholder-hotel.png').length > 1 && (
                    <div className="grid grid-cols-3 md:grid-cols-2 gap-2 max-h-[300px] md:max-h-[calc((10/16)*100%*2/3)] md:max-h-none overflow-y-auto md:overflow-y-visible"> {/* Adjusted max-h */}
                        {imagesFromProps.map((imgUrl, index) => (
                            <button
                                key={index}
                                onClick={() => setMainImageUrl(imgUrl)}
                                className={cn(
                                    "relative aspect-square rounded-md overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 dark:focus-visible:ring-offset-gray-800 bg-gray-100 dark:bg-gray-700", // Added background color
                                    // Apply ring styling based on the state variable 'mainImageUrl'
                                    imgUrl === mainImageUrl ? 'ring-2 ring-offset-2 ring-blue-600 dark:ring-blue-400' : 'opacity-75 hover:opacity-100 transition-opacity'
                                )}
                                aria-label={`View image ${index + 1}`}
                                aria-current={imgUrl === mainImageUrl ? 'true' : 'false'} // Accessibility for current item
                            >
                                {/* *** USE STANDARD <img> TAG *** */}
                                <img
                                    src={imgUrl}
                                    alt={`Thumbnail ${index + 1} for ${hotel.name}`}
                                    loading="lazy" // Lazy load thumbnails
                                    className="absolute inset-0 w-full h-full object-cover"
                                    onError={(e) => handleImageError(e, imgUrl)} // Use error handler
                                />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Optional Description/Map sections would go here */}

        </section>
    );
};

export default HotelDetailsView;