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
    whereClause.location = { contains: filters.city, mode: 'insensitive' };
  }
  if (filters.name) {
    whereClause.name = { contains: filters.name, mode: 'insensitive' };
  }
  if (filters.starRating) {
    const ratingNum = Number(filters.starRating);
    if (!isNaN(ratingNum)) { // Check if conversion was successful
      whereClause.starRating = { gte: ratingNum }; // Use 'gte'
      console.log("Applying MINIMUM starRating filter:", whereClause.starRating);
    } else {
       console.warn("Received invalid starRating filter value:", filters.starRating);
    }
  } else {
     console.log("No star rating filter applied.");
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
    const amenitiesString = filters.amenities;
    console.log("Received amenities string:", amenitiesString);
    const amenitiesArray = amenitiesString.split(',')
                                      .map(a => a.trim().toLowerCase()) // Convert to lowercase for case-insensitive comparison
                                      .filter(Boolean); // Ensure empty strings are removed
    console.log("Parsed amenities array (lowercase):", amenitiesArray);
    if (amenitiesArray.length > 0) {
        // Use a complex filter where we check each room type amenity in lowercase form
        roomTypeFilter.amenities = {
            hasSome: amenitiesArray.map(amenity => new RegExp(amenity, 'i').toString())
        };
        // Alternatively, filter in application code after query if regex doesn't work well with Prisma
        console.log("Applying case-insensitive amenities filter:", roomTypeFilter.amenities);
    }
  }

  if (filters.roomTypeId) {
    roomTypeFilter.id = Number(filters.roomTypeId);
  }
  if (filters.roomTypeName) {
    roomTypeFilter.name = { contains: filters.roomTypeName, mode: 'insensitive' };
  }
  // if no date range is provided, we simply require availableRooms > 0.
  if (!filters.checkInDate || !filters.checkOutDate) {
    console.log("No check-in/check-out dates provided. Filtering by available rooms.");
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
      consoile.log("Check-in and check-out dates provided. Calculating effective availability.");
      const requestedCheckIn = new Date(filters.checkInDate);
      const requestedCheckOut = new Date(filters.checkOutDate);
      
      // For each hotel, update each room type with effective availability.
      const hotelsWithAvailability = hotels.map(hotel => {
        // Process each room type:
        const availableRoomTypes = hotel.roomTypes.map(rt => {
          // Count bookings that overlap with the requested date range.
          const overlappingBookings = rt.bookings.filter(booking => {
            // Only consider confirmed bookings
            if (booking.status !== "confirmed") return false;
            
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
  // 1. Input Validation & Sanitization
  const name = data.name?.trim();
  const address = data.address?.trim();
  const location = data.location?.trim();
  let starRating = data.starRating; // Keep original for validation
  const logoUrl = data.logoUrl?.trim() || null;

  if (logoUrl && !(logoUrl.startsWith('http://') || logoUrl.startsWith('https://') || logoUrl.startsWith('/'))) {
    const err = new Error('Invalid Logo URL format. Must start with http://, https://, or /.');
    err.status = 400;
    throw err;
}

  if (!name || !address || !location) {
    const err = new Error('Missing required fields: name, address, and location cannot be empty.');
    err.status = 400; // Bad Request
    throw err;
  }

  // Validate starRating if provided
  let ratingValue = null; 
  if (starRating !== undefined && starRating !== null && starRating !== '') {
      ratingValue = Number(starRating);
      if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
           const err = new Error('Invalid star rating provided. Must be between 1 and 5.');
           err.status = 400;
           throw err;
      }
  }


  // Sanitize images array
  const images = (Array.isArray(data.images) ? data.images : [])
                    .map(img => typeof img === 'string' ? img.trim() : '')
                    .filter(url => url && url.length > 10 && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')));

  console.log(`Service: Creating hotel owned by ${ownerId} with sanitized data:`, { name, address, location, starRating: ratingValue, images, logoUrl });

  // 2. Database Operation
  try {
    const newHotel = await prisma.hotel.create({
      data: {
        name: name,
        address: address,
        location: location,
        starRating: ratingValue, // Use validated/nulled rating
        images: images,
        logoUrl: logoUrl,
        ownerId: Number(ownerId),
      },
    });
    console.log("Service: Hotel created successfully:", newHotel.id);
    return newHotel;

  } catch (error) { 
    console.error("Service Error: Prisma failed to create hotel:", error);
    // Throw a generic internal server error for database issues
    const err = new Error('Failed to create hotel in database.');
    err.status = 500; // Internal Server Error
    throw err;
  }
}


/**
 * Retrieve a hotel by its ID.
 */
export async function getHotelByIdService(id, dateFilters = {}) {
  console.log("Fetching hotel with ID:", id);
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
    console.log("Hotel fetched successfully:", hotel);
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
  const hotelIdNum = Number(id);
  if (isNaN(hotelIdNum)) {
      const err = new Error("Invalid Hotel ID provided.");
      err.status = 400;
      throw err;
  }

  try {
    // 1. Fetch Hotel and Verify Ownership
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelIdNum },
    });

    if (!hotel) {
      const err = new Error("Hotel not found");
      err.status = 404;
      throw err;
    }
    if (hotel.ownerId !== userId) {
      const err = new Error("Unauthorized: You do not own this hotel.");
      err.status = 403; // Forbidden
      throw err;
    }

    const updateData = {}; 

    // 2. Build Update Payload with Validation & Sanitization

    // Process name (if present)
    if (data.name !== undefined) {
      const name = data.name?.trim();
      if (!name) { const err = new Error("Hotel name cannot be empty."); err.status=400; throw err; }
      updateData.name = name;
    }

    // Process address (if present)
    if (data.address !== undefined) {
      const address = data.address?.trim();
      if (!address) { const err = new Error("Address cannot be empty."); err.status=400; throw err; }
      updateData.address = address;
    }

    // Process location (if present)
    if (data.location !== undefined) {
      const location = data.location?.trim();
      if (!location) { const err = new Error("Location cannot be empty."); err.status=400; throw err; }
      updateData.location = location;
    }

    // Process starRating (if present)
    if (data.starRating !== undefined) {
        let ratingValue = null; // Declare ratingValue here
        if (data.starRating !== null && data.starRating !== '') {
            ratingValue = Number(data.starRating);
            if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
                const err = new Error("Invalid star rating (must be 1-5 or null/empty)."); err.status=400; throw err;
            }
        }
        updateData.starRating = ratingValue; // Assign null or the validated number
    }

    // Process logoUrl (if present) - Now updateData exists
    if (data.logoUrl !== undefined) {
      const logoUrl = data.logoUrl?.trim() || null; // Allow setting to null/empty
      if (logoUrl && !(logoUrl.startsWith('http://') || logoUrl.startsWith('https://') || logoUrl.startsWith('/'))) {
           const err = new Error('Invalid Logo URL format.'); err.status=400; throw err;
      }
      updateData.logoUrl = logoUrl; // Assign null or the validated URL
    }

    // Process images (if present)
    if (data.images !== undefined) {
      // Ensure it's an array and sanitize
      updateData.images = (Array.isArray(data.images) ? data.images : [])
                            .map(img => typeof img === 'string' ? img.trim() : '')
                            .filter(url => url && url.length > 10 && (url.startsWith('http') || url.startsWith('/')));
       console.log("Service UpdateHotel: Sanitized images:", updateData.images);
    }

    // Check if any updates are actually being made
    if (Object.keys(updateData).length === 0) {
       console.log("Service UpdateHotel: No valid fields provided for update. No changes made.");
       return hotel; // Return the original hotel data if nothing changed
    }

    // 3. Perform Prisma Update
    console.log(`Service: Updating hotel ${hotelIdNum} with payload:`, updateData);
    const updatedHotel = await prisma.hotel.update({
      where: { id: hotelIdNum },
      data: updateData, // Pass the dynamically built update object
    });
    console.log("Service UpdateHotel: Update successful.");
    return updatedHotel;

  } catch (error) { // Catch block
    console.error(`Service Error updating hotel ${id}:`, error);

    if (!error.status) {
      const err = new Error(`Failed to update hotel: ${error.message}`);
      err.status = 500; // Default internal error
      throw err;
    }
    throw error; // Re-throw errors with status codes (like 400, 403, 404)
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
  const hotelIdNum = Number(hotelId);
  if (isNaN(hotelIdNum)) {
       const err = new Error("Invalid Hotel ID provided.");
       err.status = 400;
       throw err;
  }

  try {
    // --- Authorization & Hotel Check ---
    if (!userId) { const err = new Error("Unauthorized."); err.status = 401; throw err; } // Simplified error
    const hotel = await prisma.hotel.findUnique({ where: { id: hotelIdNum }, select: { ownerId: true } });
    if (!hotel) { const err = new Error("Hotel not found."); err.status = 404; throw err; }
    if (hotel.ownerId !== userId) { const err = new Error("Unauthorized."); err.status = 403; throw err; }
    // --- End Auth Check ---

    // --- Data Validation & Sanitization ---
    const name = data.name?.trim();
    const pricePerNight = data.pricePerNight;
    const availableRooms = data.availableRooms;

    if (!name) { const err = new Error("Room type name cannot be empty."); err.status = 400; throw err; }

    const priceValue = Number(pricePerNight);
    if (pricePerNight === undefined || pricePerNight === null || isNaN(priceValue) || priceValue < 0) {
         const err = new Error("Invalid or missing price per night."); err.status = 400; throw err;
    }
    const roomsValue = Number(availableRooms);
    if (availableRooms === undefined || availableRooms === null || isNaN(roomsValue) || roomsValue < 0 || !Number.isInteger(roomsValue)) {
         const err = new Error("Invalid or missing available rooms count."); err.status = 400; throw err;
    }

    const amenities = (Array.isArray(data.amenities) ? data.amenities : [])
                        .map(a => typeof a === 'string' ? a.trim() : '')
                        .filter(Boolean);

    const images = (Array.isArray(data.images) ? data.images : [])
                      .map(img => typeof img === 'string' ? img.trim() : '')
                      .filter(url => url && url.length > 10 && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')));

    const createPayload = { name, pricePerNight: priceValue, availableRooms: roomsValue, amenities, images, hotelId: hotelIdNum };
    console.log(`Service: Creating room type payload:`, createPayload);

    // --- Prisma Create ---
    const newRoomType = await prisma.roomType.create({ data: createPayload });
    console.log("Service: Room type created successfully:", newRoomType.id);
    return newRoomType;

  } catch (error) {
    console.error(`Service Error creating room type for hotel ${hotelId}:`, error);
    if (!error.status) {
        const err = new Error(`Failed to create room type: ${error.message}`);
        err.status = 500;
        throw err;
    }
    throw error;
  }
}

export async function updateRoomTypeService(hotelId, roomTypeId, data, userId) {
  const hotelIdNum = Number(hotelId);
  const roomTypeIdNum = Number(roomTypeId);
  if (isNaN(hotelIdNum) || isNaN(roomTypeIdNum)) {
       const err = new Error("Invalid Hotel or Room Type ID provided.");
       err.status = 400;
       throw err;
  }

try {
  // 1. Fetch RoomType WITH Hotel for Ownership Check & relevant bookings
  const roomType = await prisma.roomType.findUnique({
    where: { id: roomTypeIdNum },
    include: {
         hotel: { select: { ownerId: true } },
         bookings: { where: { status: 'confirmed', checkInDate: { gt: new Date() } } }
      },
  });

  if (!roomType || roomType.hotelId !== hotelIdNum) {
    const err = new Error("Room type not found or does not belong to the hotel.");
    err.status = 404;
    throw err;
  }
  if (roomType.hotel.ownerId !== userId) {
    const err = new Error("Unauthorized: You do not own this hotel.");
    err.status = 403;
    throw err;
  }

  // 2. Prepare Update Payload & Validate Input Data
  const updatePayload = {}; // Plain JS object
  let newAvailability = roomType.availableRooms;

  if (data.name !== undefined) { /* ... validate and add name ... */ updatePayload.name = data.name.trim(); }
  if (data.pricePerNight !== undefined) { /* ... validate and add price ... */ updatePayload.pricePerNight = Number(data.pricePerNight); }
  if (data.availableRooms !== undefined) { /* ... validate and add rooms ... */ newAvailability = Number(data.availableRooms); updatePayload.availableRooms = newAvailability; }
  if (data.amenities !== undefined) { /* ... sanitize and add amenities ... */ updatePayload.amenities = (Array.isArray(data.amenities) ? data.amenities : []).map(a => typeof a === 'string' ? a.trim() : '').filter(Boolean); }
  if (data.images !== undefined) { /* ... sanitize and add images ... */ updatePayload.images = (Array.isArray(data.images) ? data.images : []).map(img => typeof img === 'string' ? img.trim() : '').filter(url => url && url.length > 10 && (url.startsWith('http') || url.startsWith('/'))); }

   if (Object.keys(updatePayload).length === 0) { /* ... return original roomType ... */ }

  // 3. Handle Booking Cancellations
  if (data.availableRooms !== undefined && newAvailability < roomType.availableRooms) {
    const activeBookings = roomType.bookings;
    if (newAvailability < activeBookings.length) {
      console.log(`Warning: Reducing available rooms from ${roomType.availableRooms} to ${newAvailability} will require canceling ${activeBookings.length - newAvailability} bookings`);
      
      // Sort bookings by creation date (newest first)
      const sortedBookings = [...activeBookings].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      // Calculate number of bookings we need to cancel
      const numBookingsToCancel = activeBookings.length - newAvailability;
      
      // Select the newest bookings to cancel
      const bookingsToCancel = sortedBookings.slice(0, numBookingsToCancel);
      const bookingIdsToCancel = bookingsToCancel.map(booking => booking.id);
      
      console.log(`Service: Canceling ${bookingIdsToCancel.length} bookings due to room availability reduction:`, bookingIdsToCancel);
      
      // Update the selected bookings to canceled status
      await prisma.booking.updateMany({
        where: {
          id: { in: bookingIdsToCancel }
        },
        data: {
          status: 'canceled',
          // cancellationReason: 'Canceled by hotel due to room availability changes'
        }
      });
    }
  }

  // 4. Perform Prisma Update
  console.log(`Service: Updating room type ${roomTypeIdNum} with payload:`, updatePayload);
  const updatedRoomType = await prisma.roomType.update({
    where: { id: roomTypeIdNum },
    data: updatePayload,
  });
  console.log("Service UpdateRoomType: Update successful.");
  return updatedRoomType;

} catch (error) { 
  console.error(`Service Error updating room type ${roomTypeId}:`, error);
  if (!error.status) {
      const err = new Error(`Failed to update room type: ${error.message}`);
      err.status = 500;
      throw err;
  }
  throw error;
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

export async function checkRoomAvailabilityService(hotelId, startDate, endDate, userId) {
  // Use consistent variable name for numeric ID
  const hotelIdNum = Number(hotelId);
  if (isNaN(hotelIdNum)) {
      const err = new Error("Invalid Hotel ID provided.");
      err.status = 400;
      throw err;
  }

  try {
    // --- Date Validation ---
    if (!startDate || !endDate) {
        const err = new Error("Both start date and end date are required.");
        err.status = 400;
        throw err;
    }
    const requestedCheckIn = new Date(startDate);
    const requestedCheckOut = new Date(endDate);
    // Check if dates are valid Date objects after parsing
    if (isNaN(requestedCheckIn.getTime()) || isNaN(requestedCheckOut.getTime())) {
        const err = new Error("Invalid date format provided.");
        err.status = 400;
        throw err;
    }
    // Check if end date is strictly after start date
    if (requestedCheckIn >= requestedCheckOut) {
        const err = new Error("End date must be after start date.");
        err.status = 400;
        throw err;
    }
    // --- End Date Validation ---


    // --- Ownership Check ---
    // Fetch only ownerId for efficiency
    const hotel = await prisma.hotel.findUnique({
      where: { id: hotelIdNum },
      select: { ownerId: true }, // Select only ownerId
    });

    if (!hotel) {
      const error = new Error("Hotel not found.");
      error.status = 404;
      throw error;
    }
    if (hotel.ownerId !== userId) {
      const error = new Error("Unauthorized: Only the hotel owner can check room availability.");
      error.status = 403; // Forbidden
      throw error;
    }
    // --- End Ownership Check ---

    console.log(`Service: Checking availability for owned hotel ${hotelIdNum} between ${startDate} and ${endDate}`);

    // Optimization: Only include CONFIRMED bookings that could possibly overlap.
    const roomTypes = await prisma.roomType.findMany({
      where: { hotelId: hotelIdNum },
      select: { // Select only necessary fields
        id: true,
        name: true,
        availableRooms: true,
        pricePerNight: true,
      },
    });

    if (roomTypes.length === 0) {
        console.log(`Service: No room types found for hotel ${hotelIdNum}.`);
        return []; // Return empty array if no rooms exist
    }

    // Get IDs of the room types for this hotel
    const roomTypeIds = roomTypes.map(rt => rt.id);

    // Find CONFIRMED bookings for THESE room types that OVERLAP the date range
    const overlappingBookings = await prisma.booking.findMany({
        where: {
            roomTypeId: { in: roomTypeIds },
            status: 'confirmed', 
            AND: [
                { checkInDate: { lt: requestedCheckOut } }, // Booking starts before requested end
                { checkOutDate: { gt: requestedCheckIn } }, // Booking ends after requested start
            ]
        },
        select: { // Only need roomTypeId for counting
            roomTypeId: true,
        }
    });

    // --- Calculate Availability per Room Type ---
    const availabilityResults = roomTypes.map(rt => {
        // Count how many CONFIRMED bookings overlap for THIS specific room type
        const bookedCount = overlappingBookings.filter(b => b.roomTypeId === rt.id).length;

        // Calculate remaining rooms (base count minus overlapping confirmed bookings)
        const remainingRooms = Math.max(0, rt.availableRooms - bookedCount);

        console.log(`Room ${rt.id} (${rt.name}): Total=${rt.availableRooms}, Booked=${bookedCount}, Remaining=${remainingRooms}`);

        return {
            roomTypeId: rt.id,
            roomTypeName: rt.name,
            totalRooms: rt.availableRooms, // Base physical count
            bookedCount: bookedCount, // Confirmed bookings during the period
            remainingRooms: remainingRooms, // Calculated available
            pricePerNight: rt.pricePerNight
        };
    });

    console.log("Service: Availability results calculated:", availabilityResults.length);
    return availabilityResults; // Return the array of calculated results

  } catch (error) {
    console.error(`Service Error checking availability for hotel ${hotelId}:`, error);
    // Preserve status code if already set (e.g., from validation)
    if (!error.status) {
        const err = new Error(`Failed to check availability: ${error.message}`);
        err.status = 500; // Default internal server error
        throw err;
    }
    throw error; // Re-throw errors with status codes
  }
}

export async function filterHotelBookingsService(hotelId, filters, userId) {
  try {
    // Validate hotelId
    if (!hotelId || isNaN(Number(hotelId))) {
      const error = new Error("Invalid hotelId provided.");
      error.status = 400;
      throw error;
    }
    
    // Check if the user is the owner of the hotel
    const hotel = await prisma.hotel.findUnique({
      where: { id: Number(hotelId) },
    });

    if (!hotel) {
      const error = new Error("Hotel not found.");
      error.status = 404;
      throw error;
    }

    if (hotel.ownerId !== userId) {
      const error = new Error("Unauthorized: Only the hotel owner can view booking information.");
      error.status = 403;
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
