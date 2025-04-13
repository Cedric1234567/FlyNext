// src/types/index.ts
import React from 'react';

// Basic User Type (expand later)
export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  // Add other fields as needed from your backend user model
  profilePicture?: string;
  phoneNumber?: string;
};

// Context Types
export type Theme = 'light' | 'dark';

export type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
};

export type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean; // To know if we are checking auth state initially
  login: (newToken: string, userData: User) => Promise<void>; // Simplify params for now
  logout: () => Promise<void>;
  // signup: (credentials) => Promise<void>; // Add later
};

// Utility Type for Providers
export type ChildrenProps = {
  children: React.ReactNode;
};

// Notification Type
export type Notification = {
  id: number;
  message: string;
  timestamp: string;
  isRead: boolean;
  type?: 'info' | 'alert' | 'warning' | 'success';
  actionUrl?: string;
};

// Booking Type
// export type Booking = {
//   id: number;
//   userId: number;
//   hotelId: number;
//   roomTypeId: number;
//   checkInDate: Date;
//   checkOutDate: Date;
//   status: string;
//   createdAt: Date;
//   updatedAt: Date;
  
//   // Relations (optional since they may not always be loaded)
//   user?: User;
//   hotel?: Hotel;
//   roomType?: RoomType;
//   itinerary?: Itinerary[];
// };

// You might also need this type if not already defined
export type Itinerary = {
  id: number;
  // Add other itinerary fields as needed
  bookingId: number;
};


export * from './hotels'; // Import all types from hotels.ts