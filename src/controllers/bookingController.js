// src/controllers/bookingController.js

import {
    createBookingService,
    filterHotelBookingsService,
    cancelBookingService,
  } from '../services/bookingService';
  
  /**
   * Create a new booking.
   *
   * Delegates to the booking service.
   */
  export async function createBooking(data, userId) {
    return await createBookingService(data, userId);
  }
  
  /**
   * List all bookings for a given user.
   *
   * Delegates to the booking service.
   */
  export async function filterBookings(userId) {
    return await filterHotelBookingsService(userId);
  }
  
  /**
   * Cancel an existing booking.
   *
   * Delegates to the booking service.
   */
  export async function cancelBooking(bookingId, userId) {
    return await cancelBookingService(bookingId, userId);
  }
  