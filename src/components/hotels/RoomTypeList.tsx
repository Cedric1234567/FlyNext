// src/components/hotels/RoomTypeList.tsx
import React from 'react';
import { RoomType } from '@/types';
import RoomCard from './RoomCard'; // Assuming RoomCard component exists

interface RoomTypeListProps {
    roomTypes: RoomType[];
    hotelId: number;
    checkInDate: Date | null;
    checkOutDate: Date | null;
    // *** ADD onSelectRoom prop here ***
    onSelectRoom?: (details: { hotelId: number; roomTypeId: number; checkInDate: Date; checkOutDate: Date; pricePerNight: number }) => void;
}

const RoomTypeList: React.FC<RoomTypeListProps> = ({
    roomTypes,
    hotelId,
    checkInDate,
    checkOutDate,
    onSelectRoom // <-- Destructure the prop
}) => {

    if (!roomTypes || roomTypes.length === 0) {
        // ... no rooms message ...
    }

    return (
        <div className="space-y-6">
            {roomTypes.map((roomType) => (
                <RoomCard
                    key={roomType.id}
                    roomType={roomType}
                    hotelId={hotelId}
                    checkInDate={checkInDate}
                    checkOutDate={checkOutDate}
                    onSelectRoom={onSelectRoom} // <-- Pass it down to RoomCard
                />
            ))}
        </div>
    );
};

export default RoomTypeList;