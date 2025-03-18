// src/services/hotelService.js
// queries in this file where generated using copilot
import { prisma } from '../prismaClient';

/**
 * List hotels with optional filters.
 */
export async function listHotelsService(filters) {
  // Build basic filters for hotels
  const whereClause = {};
  if (filters.city) {
    whereClause.location = filters.city;
  }
  if (filters.name) {
    whereClause.name = { contains: filters.name, mode: 'insensitive' };
  }
  if (filters.starRating) {
    whereClause.starRating = Number(filters.starRating);
  }
  
  const roomTypeFilter = {};
  if (filters.minPrice || filters.maxPrice) {
    roomTypeFilter.pricePerNight = {};
    if (filters.minPrice) {
      roomTypeFilter.pricePerNight.gte = Number(filters.minPrice);
    }
    if (filters.maxPrice) {
      roomTypeFilter.pricePerNight.lte = Number(filters.maxPrice);
    }
  }
  if (filters.amenities) {
    const amenitiesArray = filters.amenities.split(',').map(a => a.trim());
    roomTypeFilter.amenities = { hasEvery: amenitiesArray };
  }

  if (filters.roomTypeId) {
    roomTypeFilter.id = Number(filters.roomTypeId);
  }
  if (filters.roomTypeName) {
    roomTypeFilter.name = { contains: filters.roomTypeName, mode: 'insensitive' };
  }
  // if no date range is provided, we simply require availableRooms > 0.
  if (!filters.checkInDate || !filters.checkOutDate) {
    roomTypeFilter.availableRooms = { gt: 0 };
  }
  if (Object.keys(roomTypeFilter).length > 0) {
    whereClause.roomTypes = { some: roomTypeFilter };
  }

  try {
    // Include bookings for room types so we can calculate overlaps.
    const hotels = await prisma.hotel.findMany({
      where: whereClause,
      include: { 
        roomTypes: { 
          include: { bookings: true } 
        } 
      },
    });

    // If check-in and check-out dates are provided, recalculate availability.
    if (filters.checkInDate && filters.checkOutDate) {
      const requestedCheckIn = new Date(filters.checkInDate);
      const requestedCheckOut = new Date(filters.checkOutDate);
      
      // For each hotel, update each room type with effective availability.
      const hotelsWithAvailability = hotels.map(hotel => {
        // Process each room type:
        const availableRoomTypes = hotel.roomTypes.map(rt => {
          // Count bookings that overlap with the requested date range.
          const overlappingBookings = rt.bookings.filter(booking => {
            const bookingCheckIn = new Date(booking.checkInDate);
            const bookingCheckOut = new Date(booking.checkOutDate);
            // Overlap if: booking starts before requested check-out AND booking ends after requested check-in.
            return bookingCheckIn < requestedCheckOut && bookingCheckOut > requestedCheckIn;
          });
          // Calculate effective availability.
          const effectiveAvailability = Math.max(rt.availableRooms - overlappingBookings.length, 0);
          return { ...rt, effectiveAvailability };
        }).filter(rt => rt.effectiveAvailability > 0);
        
        // Only return the hotel if it has at least one room type with availability.
        return { ...hotel, roomTypes: availableRoomTypes };
      }).filter(hotel => hotel.roomTypes.length > 0);

      return hotelsWithAvailability;
    }

    return hotels;
  } catch (error) {
    const err = new Error("Failed to list hotels: " + error.message);
    err.status = 500;
    throw err;
  }
}

/**
 * Create a new hotel.
 */
export async function createHotelService(data, ownerId) {
  try {
    const newHotel = await prisma.hotel.create({
      data: {
        name: data.name,
        address: data.address,
        location: data.location,
        starRating: data.starRating ? Number(data.starRating) : null,
        images: data.images,
        ownerId: ownerId,
      },
    });
    return newHotel;
  } catch (error) {
    const err = new Error('Failed to create hotel: ' + error.message);
    err.status = 500;
    throw err;
  }
}

/**
 * Retrieve a hotel by its ID.
 */
export async function getHotelByIdService(id, dateFilters = {}) {
  try {
    // Fetch the hotel including its room types and their bookings.
    const hotel = await prisma.hotel.findUnique({
      where: { id: Number(id) },
      include: { roomTypes: { include: { bookings: true } } },
    });
    if (!hotel) {
      const err = new Error('Hotel not found');
      err.status = 404;
      throw err;
    }
    // If date filters are provided, calculate effective availability for each room type.
    if (dateFilters.checkInDate && dateFilters.checkOutDate) {
      const requestedCheckIn = new Date(dateFilters.checkInDate);
      const requestedCheckOut = new Date(dateFilters.checkOutDate);
      hotel.roomTypes = hotel.roomTypes.map(rt => {
        const overlappingBookings = rt.bookings.filter(booking => {
          const bookingCheckIn = new Date(booking.checkInDate);
          const bookingCheckOut = new Date(booking.checkOutDate);
          return bookingCheckIn < requestedCheckOut && bookingCheckOut > requestedCheckIn;
        });
        const effectiveAvailability = Math.max(rt.availableRooms - overlappingBookings.length, 0);
        return { ...rt, effectiveAvailability };
      });
    }
    return hotel;
  } catch (error) {
    if (!error.status) {
      const err = new Error('Failed to retrieve hotel: ' + error.message);
      err.status = 500;
      throw err;
    }
    throw error;
  }
}

/**
 * Update a hotel.
 * Only the hotel owner can update the hotel.
 */
export async function updateHotelService(id, data, userId) {
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id: Number(id) },
    });
    if (!hotel) {
      const err = new Error("Hotel not found");
      err.status = 404;
      throw err;
    }
    if (hotel.ownerId !== userId) {
      const err = new Error("Unauthorized: You are not the owner of this hotel.");
      err.status = 403;
      throw err;
    }
    
    // Build update data dynamically to avoid overwriting with undefined values.
    const updateData = {
      name: data.name !== undefined ? data.name : hotel.name,
      address: data.address !== undefined ? data.address : hotel.address,
      location: data.location !== undefined ? data.location : hotel.location,
      starRating: data.starRating !== undefined ? Number(data.starRating) : hotel.starRating,
      images: data.images !== undefined ? data.images : hotel.images,
    };

    const updatedHotel = await prisma.hotel.update({
      where: { id: Number(id) },
      data: updateData,
    });
    return updatedHotel;
  } catch (error) {
    if (!error.status) {
      const err = new Error("Failed to update hotel: " + error.message);
      err.status = 500;
      throw err;
    }
    throw error;
  }
}

/**
 * Delete a hotel.
 * Only the hotel owner can delete the hotel.
 */
export async function deleteHotelService(id, userId) {
  try {
    const hotel = await prisma.hotel.findUnique({
      where: { id: Number(id) },
    });
    if (!hotel) {
      const err = new Error('Hotel not found');
      err.status = 404;
      throw err;
    }
    console.log("Hello");
    console.log(hotel.ownerId, userId);
    if (hotel.ownerId !== userId) {
      const err = new Error('Unauthorized: You are not the owner of this hotel.');
      err.status = 403;
      throw err;
    }
    await prisma.hotel.delete({
      where: { id: Number(id) },
    });
  } catch (error) {
    if (!error.status) {
      const err = new Error('Failed to delete hotel: ' + error.message);
      err.status = 500;
      throw err;
    }
    throw error;
  }
}

export async function createRoomTypeService(hotelId, data, userId) {
  try {
    // Ensure that a valid userId is provided.
    if (!userId) {
      const error = new Error("Unauthorized: User is not authenticated.");
      error.status = 401;
      throw error;
    }

    // Verify that the hotel exists.
    const hotel = await prisma.hotel.findUnique({
      where: { id: Number(hotelId) },
    });
    if (!hotel) {
      const error = new Error("Hotel not found.");
      error.status = 404;
      throw error;
    }

    // Check if the authenticated user is the owner of the hotel.
    if (hotel.ownerId !== userId) {
      const error = new Error("Unauthorized: You are not the owner of this hotel.");
      error.status = 403;
      throw error;
    }

    // Create the room type.
    const newRoomType = await prisma.roomType.create({
      data: {
        name: data.name,
        pricePerNight: Number(data.pricePerNight),
        availableRooms: Number(data.availableRooms),
        amenities: data.amenities || [],
        images: data.images || [],
        hotelId: Number(hotelId),
      },
    });
    return newRoomType;
  } catch (error) {
    // Wrap and propagate the error with a proper status code.
    const err = new Error("Failed to create room type: " + error.message);
    err.status = error.status || 500;
    throw err;
  }
}


export async function updateRoomTypeService(hotelId, roomTypeId, data, userId) {
  try {
    // Fetch the room type along with its bookings.
    const roomType = await prisma.roomType.findUnique({
      where: { id: Number(roomTypeId) },
      include: { bookings: true },
    });

    if (!roomType || roomType.hotelId !== Number(hotelId)) {
      throw new Error("Room type not found for this hotel");
    }

    // Determine new available room count.
    // If data.availableRooms is provided, use it; otherwise, keep the current count.
    const newAvailability =
      data.availableRooms !== undefined
        ? Number(data.availableRooms)
        : roomType.availableRooms;

    // Filter active bookings: confirmed and with a check-in date in the future.
    const activeBookings = roomType.bookings.filter(booking => {
      return booking.status === "confirmed" && new Date(booking.checkInDate) > new Date();
    });

    // If new availability is less than the number of active bookings, cancel the excess ones.
    if (newAvailability < activeBookings.length) {
      const bookingsToCancelCount = activeBookings.length - newAvailability;
      
      // Sort active bookings descending by creation date (cancel the most recent ones).
      activeBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      const bookingsToCancel = activeBookings.slice(0, bookingsToCancelCount);
      for (const booking of bookingsToCancel) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "cancelled" },
        });
        // TODO:consider triggering a notification to the affected user here.
      }
    }

    // Now update the room type with the new data.
    const updatedRoomType = await prisma.roomType.update({
      where: { id: Number(roomTypeId) },
      data: {
        name: data.name || roomType.name,
        amenities: data.amenities || roomType.amenities,
        pricePerNight: data.pricePerNight ? Number(data.pricePerNight) : roomType.pricePerNight,
        availableRooms: newAvailability,
        images: data.images || roomType.images,
      },
    });
    return updatedRoomType;
  } catch (error) {
    throw new Error("Failed to update room type: " + error.message);
  }
}

export async function deleteRoomTypeService(hotelId, roomTypeId, userId) {
  try {
    // Ensure room type belongs to the hotel
    const roomType = await prisma.roomType.findUnique({
      where: { id: Number(roomTypeId) },
      include: { hotel: true },
    });

    if (!roomType || roomType.hotelId !== Number(hotelId)) {
      const err = new Error("Couldnt find this room type. Please ensure that the room type and hotel exist");
      err.status = 404;
      throw err;
    }
    if (roomType.hotel.ownerId !== userId) {
      const err = new Error("Unauthorized: You are not the owner of this hotel");
      console.log(roomType.hotel.ownerId, userId);
      err.status = 403;
      throw err;
    }

    await prisma.roomType.delete({
      where: { id: Number(roomTypeId) },
    });

    return { message: "Room type deleted successfully" };
  } catch (error) {
    const err = new Error("Failed to delete room type: " + error.message);
    err.status = error.status || 500;
    throw err;
  }
}

export async function checkRoomAvailabilityService(hotelId, startDate, endDate) {
  try {
    // Fetch room types for the hotel along with their bookings.
    const roomTypes = await prisma.roomType.findMany({
      where: { hotelId: Number(hotelId) },
      include: { bookings: true },
    });

    // Calculate availability per room type.
    const availability = roomTypes.map(rt => {
      // Count bookings that overlap with the provided date range.
      // A booking overlaps if: booking.checkInDate < endDate AND booking.checkOutDate > startDate.
      const overlappingBookings = rt.bookings.filter(booking => {
        return new Date(booking.checkInDate) < new Date(endDate) &&
               new Date(booking.checkOutDate) > new Date(startDate);
      });
      // Compute remaining available rooms (ensure non-negative).
      const remaining = Math.max(rt.availableRooms - overlappingBookings.length, 0);
      return {
        roomTypeId: rt.id,
        roomTypeName: rt.name,
        remainingRooms: remaining,
        pricePerNight: rt.pricePerNight
      };
    });
    return availability;
  } catch (error) {
    throw new Error("Failed to check availability: " + error.message);
  }
}

export async function filterHotelBookingsService(hotelId, filters) {
  try {
    // Validate hotelId
    if (!hotelId || isNaN(Number(hotelId))) {
      const error = new Error("Invalid hotelId provided.");
      error.status = 400;
      throw error;
    }
    
    // Build the base where clause for bookings belonging to the hotel.
    const whereClause = { hotelId: Number(hotelId) };

    // Validate and add roomTypeId if provided
    if (filters.roomTypeId) {
      if (isNaN(Number(filters.roomTypeId))) {
        const error = new Error("Invalid roomTypeId provided.");
        error.status = 400;
        throw error;
      }
      whereClause.roomTypeId = Number(filters.roomTypeId);
    }

    // Validate date range if provided: both dates should be provided and valid.
    if ((filters.startDate && !filters.endDate) || (!filters.startDate && filters.endDate)) {
      const error = new Error("Both startDate and endDate must be provided together.");
      error.status = 400;
      throw error;
    }
    
    if (filters.startDate && filters.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        const error = new Error("Invalid date format for startDate or endDate.");
        error.status = 400;
        throw error;
      }
      // Overlap condition: booking.checkInDate <= filters.endDate AND booking.checkOutDate >= filters.startDate
      whereClause.AND = [
        { checkInDate: { lte: endDate } },
        { checkOutDate: { gte: startDate } }
      ];
    }

    // Fetch bookings with filtering applied.
    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: { user: true, roomType: true },
      orderBy: { createdAt: "desc" }
    });
    return bookings;
  } catch (error) {
    // Attach a status if not already present
    const err = new Error("Failed to filter bookings: " + error.message);
    err.status = error.status || 500;
    throw err;
  }
}
