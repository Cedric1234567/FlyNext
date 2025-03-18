// src/controllers/hotelController.js
import {
  listHotelsService,
  createHotelService,
  getHotelByIdService,
  updateHotelService,
  deleteHotelService,
} from '../services/hotelService';

/**
 * List hotels.
 */
export async function listHotels(filters) {
  return await listHotelsService(filters);
}

/**
 * Create a new hotel.
 */
export async function createHotel(data, ownerId) {
  return await createHotelService(data, ownerId);
}

/**
 * Retrieve a hotel by ID, optionally using date filters to calculate room availability.
 */
export async function getHotelById(id, dateFilters = {}) {
  return await getHotelByIdService(id, dateFilters);
}

/**
 * Update a hotel.
 */
export async function updateHotel(id, data, userId) {
  return await updateHotelService(id, data, userId);
}

/**
 * Delete a hotel.
 */
export async function deleteHotel(id, userId) {
  return await deleteHotelService(id, userId);
}
