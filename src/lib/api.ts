// src/lib/api.ts
import {
    Hotel, // Assuming defined in @/types
    HotelSearchResult, // Assuming defined in @/types
    RoomAvailabilityInfo, // Assuming defined in @/types
    // Import other necessary types from '@/types' as you define them:
    // User, Booking, Itinerary, Notification, LoginCredentials, AuthResponse, etc.
} from '@/types'; // Adjust the import path as necessary

// --- Define Placeholder Types (REMOVE THESE as you import real types from '@/types') ---
type LoginCredentials = any;
type AuthResponse = { accessToken: string; refreshToken: string; user: User };
type UserSignupData = any;
type User = any;
type Notification = any;
type HotelCreateData = any;
type HotelUpdateData = any;
type RoomType = any;
type RoomTypeCreateData = any;
type RoomTypeUpdateData = any;
type Booking = any;
type Itinerary = any;
type ItineraryDetails = any;
type CardDetails = any;
type FlightSearchResult = any;
type AFSBookingConfirmation = any;
type FlightStatus = any;
// --- End Placeholder Types ---


// Define a custom error class for API errors
export class HTTPError extends Error {
    status: number;
    info?: any; // Optional additional info from error response body

    constructor(status: number, message: string, info?: any) {
      super(message);
      this.status = status;
      this.info = info;
      this.name = 'HTTPError';
    }
}

// --- Configuration ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api'; // Default to relative /api if not set

// --- Helper Function ---
async function apiCall<T = any>(
    endpoint: string,
    method: string = 'GET',
    body: any = null,
    requiresAuth: boolean = false,
    tokenOverride: string | null = null,
    signal?: AbortSignal
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      Accept: 'application/json',
    };

    let token: string | null = tokenOverride;
    if (requiresAuth && !token) {
      try {
         if (typeof window !== 'undefined') {
              token = localStorage.getItem('accessToken');
         }
      } catch (e) {
          console.warn("Could not access localStorage for token.");
      }
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      method,
      headers,
      signal,
    };

    if (body !== null && body !== undefined) { // Check for null/undefined before stringifying
      headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorInfo: any = null;
        try {
          errorInfo = await response.json();
        } catch (e) { /* Ignore if error response not JSON */ }
        throw new HTTPError(
          response.status,
          `HTTP error! Status: ${response.status} ${response.statusText}`,
          errorInfo
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
          return response.blob() as Promise<T>;
      } else if (response.status === 204 || response.headers.get('content-length') === '0') {
          return null as T;
      } else if (contentType && contentType.includes('application/json')) {
          return response.json() as Promise<T>;
      } else {
          // Default to text if unsure, adjust if other types needed
          return response.text() as Promise<T>;
      }

    } catch (error) {
      if (error instanceof HTTPError) {
        throw error;
      } else if (error instanceof Error) {
          console.error(`API Call Failed: ${method} ${endpoint}`, error);
          throw new HTTPError(500, `Network or other error: ${error.message}`);
      } else {
          throw new HTTPError(500, `An unknown error occurred: ${error}`);
      }
    }
}

// --- API Function Implementations ---

// === Authentication ===
export const loginUser = (credentials: LoginCredentials): Promise<AuthResponse> =>
  apiCall<AuthResponse>('/auth/login', 'POST', credentials);

export const signupUser = (userData: UserSignupData): Promise<{ user: User; message: string }> =>
  apiCall('/auth/signup', 'POST', userData);

export const refreshToken = (refreshTok: string): Promise<{ accessToken: string }> =>
  apiCall('/auth/refresh', 'POST', { refreshToken: refreshTok }, false, refreshTok); // Using refresh token as Bearer token (per Postman) AND in body

export const logoutUser = (userId: number): Promise<{ message: string }> =>
  apiCall('/auth/logout', 'POST', { userId });


// === User ===
export const updateUserProfile = (userId: number, data: Partial<User>): Promise<User> => // Use Partial<User> for update data
  apiCall<User>(`/user/update?userId=${userId}`, 'PATCH', data, true);


// === Hotels ===
// Define the shape of the search parameters object more explicitly
export interface HotelSearchParams {
    city?: string;
    checkInDate?: string; // YYYY-MM-DD
    checkOutDate?: string; // YYYY-MM-DD
    name?: string;
    starRating?: number;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string; // Comma-separated
}

/**
 * Fetches hotels based on search criteria.
 * Uses GET /api/hotels/index
 */
export const searchHotels = (params: HotelSearchParams): Promise<HotelSearchResult[]> => {
    // Use URLSearchParams to build the query string safely
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        // Append only if the value is defined and not null
        if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
        }
    });
    const endpoint = `/hotels/index?${queryParams.toString()}`;
    return apiCall<HotelSearchResult[]>(endpoint, 'GET'); // Public search
};

export const createHotel = (data: HotelCreateData): Promise<Hotel> =>
  apiCall<Hotel>('/hotels/index', 'POST', data, true);

/**
 * Fetches detailed information for a single hotel by its ID.
 * Optionally includes check-in/check-out dates to get date-specific availability.
 * NOTE: Currently assumes API returns { hotel: Hotel } structure based on logs.
 */
export const getHotelById = (
  id: string | number,
  checkInDate?: string,
  checkOutDate?: string
// Return type expects the wrapped object or null
): Promise<{ hotel: Hotel } | null> => {
  // --- Input Validation (Basic) ---
  if (id === null || id === undefined || String(id).trim() === '') {
      // Reject the promise for invalid ID
      return Promise.reject(new Error("Invalid Hotel ID provided to getHotelById."));
  }

  // --- Construct Query Parameters ---
  const params = new URLSearchParams();
  // Only append dates if they are valid non-empty strings
  if (checkInDate && typeof checkInDate === 'string' && checkInDate.trim()) {
      params.set('checkInDate', checkInDate);
  }
  if (checkOutDate && typeof checkOutDate === 'string' && checkOutDate.trim()) {
      params.set('checkOutDate', checkOutDate);
  }
  // *** FIX: Define queryString based on params ***
  const queryString = params.toString();

  // --- Construct Endpoint URL (Now queryString is defined) ---
  const endpoint = `/hotels/${id}${queryString ? `?${queryString}` : ''}`;
  console.log(`API Call: GET ${endpoint}`);

  // --- Make the API Call ---
  // Tell apiCall to expect the wrapped structure
  return apiCall<{ hotel: Hotel } | null>( // Adjust generic type hint
      endpoint,
      'GET',
      null, // No body for GET
      false // Assuming public access, change if auth needed
  );
};





// export const updateHotel = (id: string | number, data: HotelUpdateData): Promise<Hotel> =>
//   apiCall<Hotel>(`/hotels/${id}`, 'PATCH', data, true);

export const updateHotel = (id: string | number, data: HotelUpdateData): Promise<Hotel> => {
  console.log(`API Call: Updating hotel ${id}`);
  return apiCall<Hotel>(
      `/hotels/${id}`,
      'PATCH', // Use PATCH for partial updates
      data,
      true // Requires Auth
  );
};

// export const deleteHotel = (id: string | number): Promise<void> =>
//   apiCall<void>(`/hotels/${id}`, 'DELETE', null, true);
export const deleteHotel = (id: string | number): Promise<void> => {
  console.log(`API Call: Deleting hotel ${id}`);
  return apiCall<void>(
      `/hotels/${id}`,
      'DELETE',
      null,
      true // Requires Auth
  );
};

// Get hotels owned by a specific user
export const getUserHotels = (userId: number): Promise<Hotel[]> =>
    apiCall<Hotel[]>(`/hotels/index?ownerId=${userId}`, 'GET', null, true);

// Convenience method to get current user's hotels (uses auth token for identification)
export const getMyHotels = (): Promise<{ hotels: HotelSearchResult[] }> => {
  console.log("Calling getMyHotels API function");
  return apiCall<{ hotels: HotelSearchResult[] }>(
      '/hotels/my-hotels', // Endpoint path
      'GET',              // Method
      null,               // No body
      true                // REQUIRES AUTH! apiCall will add Authorization header
  );
};


// === Room Types ===
// export const createRoomType = (hotelId: string | number, data: RoomTypeCreateData): Promise<RoomType> =>
//   apiCall<RoomType>(`/hotels/${hotelId}/room-types`, 'POST', data, true);
export const createRoomType = (hotelId: string | number, data: RoomTypeCreateData): Promise<RoomType> => {
  console.log(`API Call: Creating room type for hotel ${hotelId}`);
  return apiCall<RoomType>(
      `/hotels/${hotelId}/room-types`,
      'POST',
      data, // Send room type details in body
      true  // Requires Auth
  );
};
export const updateRoomType = (hotelId: string | number, roomTypeId: string | number, data: RoomTypeUpdateData): Promise<RoomType> =>
  apiCall<RoomType>(`/hotels/${hotelId}/room-types/${roomTypeId}`, 'PATCH', data, true);

export const deleteRoomType = (hotelId: string | number, roomTypeId: string | number): Promise<void> =>
  apiCall<void>(`/hotels/${hotelId}/room-types/${roomTypeId}`, 'DELETE', null, true);

// export const checkRoomAvailability = (hotelId: string | number, startDate: string, endDate: string): Promise<RoomAvailabilityInfo[]> =>
//     apiCall<RoomAvailabilityInfo[]>(`/hotels/${hotelId}/availability?startDate=${startDate}&endDate=${endDate}`, 'GET');
export const checkRoomAvailability = (
  hotelId: string | number,
  startDate: string, // Expect YYYY-MM-DD string
  endDate: string    // Expect YYYY-MM-DD string
): Promise<RoomAvailabilityInfo[]> => { // Expects direct array return
  if (!startDate || !endDate) {
       // Avoid API call if dates are missing
      return Promise.reject(new Error("Start date and end date are required."));
  }
  const endpoint = `/hotels/${hotelId}/availability?startDate=${startDate}&endDate=${endDate}`;
  console.log(`API Call: GET ${endpoint}`);
  // Requires auth because backend checks ownership based on token
  return apiCall<RoomAvailabilityInfo[]>(endpoint, 'GET', null, true);
};

// === Hotel Bookings ===
export interface HotelBookingFilters {
    startDate?: string;
    endDate?: string;
    roomTypeId?: string | number;
}
/**
 * Fetches hotel bookings for a specific hotel (for owner view).
 * Uses GET /api/hotels/{hotelId}/bookings
 */
export const getHotelBookingsForOwner = (hotelId: string | number, filters?: HotelBookingFilters): Promise<Booking[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    if (filters?.roomTypeId) params.set('roomTypeId', String(filters.roomTypeId));
    const queryString = params.toString();
    return apiCall<Booking[]>(`/hotels/${hotelId}/bookings${queryString ? `?${queryString}` : ''}`, 'GET', null, true);
};

/**
 * Cancels a specific hotel booking by its ID.
 * Can be called by the user who made the booking or the hotel owner.
 * Uses DELETE /api/hotels/bookings
 * NOTE: Postman showed bookingId in body for DELETE, which is unusual. Adjust if backend expects it in query param.
 */
export const cancelHotelBooking = (bookingId: number): Promise<{ message: string }> =>
  apiCall('/hotels/bookings', 'DELETE', { bookingId }, true);


// === Notifications ===
export const getNotifications = (): Promise<Notification[]> =>
  apiCall<Notification[]>('/notifications', 'GET', null, true); // Assumes backend gets userId from token

export const getNotificationCount = (): Promise<{ count: number }> =>
  apiCall<{ count: number }>('/notifications/count', 'GET', null, true); // Assumes backend gets userId from token

export const markNotificationRead = (notificationId: number): Promise<Notification> =>
  apiCall<Notification>(`/notifications?notificationId=${notificationId}`, 'PATCH', null, true);


// === Flights (Proxy to AFS) ===
export const searchFlights = (params: URLSearchParams): Promise<FlightSearchResult[]> =>
    apiCall<FlightSearchResult[]>(`/flights/search?${params.toString()}`, 'GET');

export const bookFlight = (data: { flightIds: string[], passportNumber: string }): Promise<AFSBookingConfirmation> =>
  apiCall<AFSBookingConfirmation>('/flights/booking', 'POST', data, true);

export const verifyFlightBooking = (bookingReference: string): Promise<FlightStatus[]> =>
  apiCall<FlightStatus[]>(`/flights/verifybookings?bookingReference=${bookingReference}`, 'GET', null, true);

export const cancelFlightBooking = (bookingReference: string): Promise<{ message: string } | void> =>
    apiCall(`/flights/booking/${bookingReference}`, 'DELETE', null, true); // Verify exact backend route


// === Bookings (Itinerary) ===
export const createItinerary = (data: { hotelBooking?: number; flightBooking?: string }): Promise<Itinerary> =>
  apiCall<Itinerary>('/bookings', 'POST', data, true);

export const getItineraryDetails = (itineraryId: string | number): Promise<ItineraryDetails> =>
  apiCall<ItineraryDetails>(`/bookings/view?itineraryId=${itineraryId}`, 'GET', null, true);

export const checkoutItinerary = (itineraryId: string | number, cardDetails: CardDetails): Promise<{ message: string; invoiceUrl?: string }> =>
  apiCall('/bookings/checkout', 'POST', { itineraryId: String(itineraryId), ...cardDetails }, true);

export const getBookingPdf = (itineraryId: string | number): Promise<Blob> =>
  apiCall<Blob>(`/bookings/pdf?itineraryId=${itineraryId}`, 'GET', null, true);

/**
 * Cancels the HOTEL part of a booking itinerary using the dedicated endpoint.
 * Uses POST /api/bookings/cancel
 * NOTE: Confusing overlap with DELETE /hotels/bookings. Confirm backend logic.
 */
export const cancelHotelPartOfItinerary = (hotelBookingId: number): Promise<{ message: string }> =>
    apiCall('/bookings/cancel', 'POST', { hotelBooking: hotelBookingId }, true);


// === AFS Data Fetch (Server-Side / Scripts ONLY - Do Not Call From Frontend with Key) ===
export const fetchAfsCities = (apiKey: string): Promise<any[]> =>
    apiCall('/afs/cities', 'GET', null, false, apiKey);

export const fetchAfsAirports = (apiKey: string): Promise<any[]> =>
    apiCall('/afs/airports', 'GET', null, false, apiKey);