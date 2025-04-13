// src/components/hotels/HotelList.tsx
import React from 'react';
import HotelCard from './HotelCard'; // Import the card component
import { HotelSearchResult } from '@/types'; // Import the specific type

interface HotelListProps {
    hotels: HotelSearchResult[]; // Expect an array of search results
}

const HotelList: React.FC<HotelListProps> = ({ hotels }) => {
    // Handle the case where there are no results AFTER a search was performed
    if (hotels.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                <h2 className="text-xl font-semibold mb-2">No Hotels Found</h2>
                <p>Try adjusting your search criteria or dates.</p>
            </div>
        );
    }

    // Render the list of hotels using a grid layout
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {hotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
            ))}
        </div>
    );
};

export default HotelList;