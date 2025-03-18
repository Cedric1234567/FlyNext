// src/app/api/hotels/bookings/route.js
// Note: The GET request was generated using copilot
import { NextResponse } from 'next/server';
import { createBooking, cancelBooking } from '../../../../controllers/bookingController';
import { filterHotelBookingsService } from '../../../../services/bookingService';
import { verifyToken } from '../../../../utils/auth';

// GET: List bookings for the authenticated user
export async function GET(request) {
  try {
    const token = verifyToken(request);
    if (!token || (token && token.error)) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: token.userEmail } });

    // Extract filtering parameters and the "view" parameter from the query string
    const { searchParams } = new URL(request.url);
    const filters = {
      roomTypeId: searchParams.get('roomTypeId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate')
    };
    const view = searchParams.get('view'); // if view equals "owner", then fetch bookings for hotels they own

    const bookings = await filterHotelBookingsService(user.id, filters, view);
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error in GET /api/hotels/bookings:', error);
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}

// POST: Create a new booking for the authenticated user
export async function POST(request) {
  try {
    const token = verifyToken(request);
    if (!token || (token && token.error)) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
    }

    // Validate that the token contains the required user information
    if (!token.userEmail) {
      return NextResponse.json({ error: 'Token is missing required user information like an email.' }, { status: 400 });
    }

    // Parse the request body for hotel details.
    const body = await request.json();

    //vaidate required booking fields
    const { hotelId, roomTypeId, checkInDate, checkOutDate } = body;
    if (!hotelId || !roomTypeId || !checkInDate || !checkOutDate) {
      return NextResponse.json(
        { error: 'Missing required booking fields: hotelId, roomTypeId, checkInDate, checkOutDate' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email: token.userEmail } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    // Expecting body to include: hotelId, roomTypeId, checkInDate, checkOutDate, and optionally status.
    const newBooking = await createBooking(body, user.id);
    return NextResponse.json({ booking: newBooking }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/hotels/bookings:', error);
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}

// DELETE: Cancel a booking
export async function DELETE(request) {
  try {
    const token = verifyToken(request);
    if (!token || (token && token.error)) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: token.userEmail } });
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }
    // Expect the booking ID in the request body
    const { bookingId } = await request.json();
    if (!bookingId) {
      return NextResponse.json({ error: 'Booking ID is required' }, { status: 400 });
    }
    await cancelBooking(bookingId, user.id);
    return NextResponse.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/hotels/bookings:', error);
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
