// src/types/hotels.ts

// Assuming you might have User and Booking types defined elsewhere (e.g., auth.ts, bookings.ts)
// If not, you can define basic placeholders here or import them later.
// import { User } from './auth'; // Example import
// import { Booking } from './bookings'; // Example import

// Basic Placeholder Types (Remove/Replace if defined elsewhere)
interface User {
    id: number;
    firstName?: string; // Add other fields you might need
}
interface Booking {
    id: number;
    // Add other fields you might need
}
// --- End Placeholder Types ---


/**
 * Represents a Hotel entity based on the Prisma schema.
 */
export interface Hotel {
    id: number;
    name: string;
    address: string;
    location: string; // City name
    starRating: number | null; // Can be null
    images: string[]; // Assuming JSON stores an array of image URLs
    ownerId: number;
    owner?: User; // Optional: Might be included in some API responses
    roomTypes?: RoomType[]; // Optional: Typically included when fetching a single hotel
    bookings?: Booking[]; // Optional: Less likely to be included by default
    createdAt: string; // Dates are usually ISO strings in API responses
    updatedAt: string;
    logoUrl?: string | null;
}

/**
 * Represents the data structure specifically returned for hotel search results.
 * Optimized for list display, includes a calculated starting price.
 */
export interface HotelSearchResult {
    id: number;
    name: string;
    location: string; // City
    starRating: number | null;
    mainImage: string | null; // URL of the primary image (backend should select one)
    startingPrice: number | null; // Minimum price/night for available rooms matching criteria (calculated by backend)
    // Optionally include a few key amenities if the backend provides them
    // keyAmenities?: string[];
}

/**
 * Represents a RoomType entity based on the Prisma schema.
 * Includes an optional field for dynamically calculated availability.
 */
export interface RoomType {
    id: number;
    name: string;
    amenities: string[]; // Assuming JSON stores an array of amenity strings
    pricePerNight: number;
    availableRooms: number; // Base availability count from DB
    images: string[]; // Assuming JSON stores an array of image URLs
    hotelId: number;
    hotel?: Hotel; // Optional: Usually not needed if fetched within a Hotel context
    bookings?: Booking[]; // Optional: Less likely to be included by default
    // Frontend/API specific fields:
    effectiveAvailability?: number; // Calculated availability based on selected dates
}

// === Optional: Define types for API request payloads ===

export interface HotelCreateData {
    name: string;
    address: string;
    location: string;
    starRating?: number;
    images: string[];
    // ownerId is usually derived from the authenticated user on the backend
}

export interface HotelUpdateData {
    name?: string;
    address?: string;
    location?: string;
    starRating?: number;
    images?: string[];
}

export interface RoomTypeCreateData {
    name: string;
    amenities?: string[];
    pricePerNight: number;
    availableRooms: number;
    images?: string[];
    // hotelId is usually part of the URL path
}

export interface RoomTypeUpdateData {
    name?: string;
    amenities?: string[];
    pricePerNight?: number;
    availableRooms?: number; // Remember backend handles cancellation logic if decreased
    images?: string[];
}

// Type for availability check response
export interface RoomAvailabilityInfo {
    roomTypeId: number;
    roomTypeName: string;
    remainingRooms: number;
    pricePerNight: number;
}