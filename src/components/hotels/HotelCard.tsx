// src/components/hotels/HotelCard.tsx
import React from 'react';
import Link from 'next/link';
// *** REMOVED: import Image from 'next/image'; ***
// Assuming RatingStarsDisplay is the correct name and import path
import RatingStarsDisplay from '@/components/ui/RatingStar'; // Use your display component
import { cn } from '@/lib/utils'; // Your class merging utility
import { HotelSearchResult } from '@/types'; // Import the specific type for search results
import { Button } from '@/components/ui/Button'; // Your button component


interface HotelCardProps {
  hotel: HotelSearchResult; // Expecting the optimized search result structure
  className?: string;
}

const HotelCard: React.FC<HotelCardProps> = ({ hotel, className }) => {
  // Use mainImage from search result type, fallback to placeholder
  const imageUrl = hotel.mainImage || '/placeholder-hotel.png';
  console.log(`Rendering Image with URL: "${imageUrl}"`); // Keep log for debugging URLs
  // Decide if the price should be shown or a fallback message
  const showPrice = hotel.startingPrice !== null && hotel.startingPrice !== undefined;
  // Using toFixed(0) as per your original JSX example for the badge
  const priceDisplay = showPrice ? `$${hotel.startingPrice?.toFixed(0)}` : 'N/A';

  return (
    // Card container - applies base styles and uses group for hover states
    <div
      className={cn(
        'border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm',
        'bg-white dark:bg-gray-800', // Background colors
        'hover:shadow-lg transition-all duration-300', // Hover effect
        'flex flex-col h-full', // Ensure card takes full height in grid cell
        'group', // Add group for coordinating hover effects
        className // Allow overriding classes
      )}
    >
      {/* Image Section with Price Overlay */}
      {/* Wrap Image Container in Link for clickability */}
      <Link href={`/hotels/${hotel.id}`} aria-label={`View details for ${hotel.name}`}>
        <div className="relative w-full h-48 sm:h-56 overflow-hidden"> {/* Adjusted height slightly */}
           {/* *** USE STANDARD <img> TAG *** */}
          <img
            src={imageUrl}
            alt={`Image of ${hotel.name}`}
            // Add width/height attributes for better layout performance, though CSS covers it mostly
            // width={300} // Example intrinsic width (optional)
            // height={224} // Example intrinsic height (optional)
            loading="lazy" // Standard browser lazy loading
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ease-in-out" // Use h-full too
            onError={(e) => {
              // Fallback if image fails to load
              const imgElement = e.currentTarget as HTMLImageElement;
              console.warn(`Failed to load image: ${imgElement.src}, falling back.`);
              imgElement.src = '/placeholder-hotel.png'; // Path to your placeholder
              // Optionally add a class to indicate fallback state
              imgElement.classList.add('img-fallback');
            }}
          />

            {/* Price badge overlay */}
            {showPrice && (
              <div className="absolute top-2 right-2 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm px-2.5 py-1 rounded-full shadow">
                <span className="text-sm font-bold text-blue-700 dark:text-blue-400">
                  {priceDisplay}
                  <span className="text-xs font-normal text-gray-600 dark:text-gray-400"> /night</span>
                </span>
              </div>
            )}
        </div>
       </Link>

      {/* Content Section */}
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        {/* Name and Rating */}
        <div className="flex justify-between items-start mb-2 gap-2">
           {/* Wrap Name in Link */}
           <Link href={`/hotels/${hotel.id}`} className="flex-grow min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate" title={hotel.name}>
                    {hotel.name}
                </h3>
           </Link>
           {/* Render rating if available */}
          {hotel.starRating !== null && hotel.starRating !== undefined && (
             <div className="flex-shrink-0 mt-0.5">
                 <RatingStarsDisplay rating={hotel.starRating} />
             </div>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span className="mr-1.5 text-base">📍</span>
          <span className="truncate">{hotel.location}</span>
        </div>

        {/* Amenities Placeholder */}
         <div className="flex gap-1.5 mb-4">
            <span className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">WiFi</span>
            <span className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">Pool</span>
            <span className="text-xs text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">...</span>
        </div>

        {/* View details button */}
        <div className="mt-auto pt-3 border-t dark:border-gray-600">
          <Link href={`/hotels/${hotel.id}`} className="block w-full">
             <Button variant="secondary" size="sm" className="w-full">
                 View Details
             </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HotelCard;