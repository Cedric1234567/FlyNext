// src/app/api/hotels/bookings/route.js
// Note: The GET request was generated using copilot
import { NextResponse } from 'next/server';
import { createBooking, cancelBooking } from '../../../../controllers/bookingController';
import { filterHotelBookingsService } from '../../../../services/bookingService';
import { verifyToken } from '../../../../utils/auth';
import { prisma } from '@/prismaClient';

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
export async function DELETE(request) {
  console.log("DELETE request received for Booking Cancellation");
  try {
      // 1. Verify Authentication Token & Get User ID
      const tokenPayload = verifyToken(request);
      if (!tokenPayload || tokenPayload.error || !tokenPayload.userEmail) {
           return NextResponse.json({ error: 'Unauthorized: Invalid or missing token' }, { status: 401 });
      }
      const userEmail = tokenPayload.userEmail;
      const requestingUser = await prisma.user.findUnique({
           where: { email: userEmail },
           select: { id: true }
      });
      if (!requestingUser) {
           return NextResponse.json({ error: 'Unauthorized: Requesting user not found' }, { status: 401 });
      }
      const requestingUserId = requestingUser.id;
      console.log(`Cancellation request from user ID: ${requestingUserId}`);

      // 2. Get Booking ID from Request Body
      let bookingId;
      try {
          const body = await request.json();
          bookingId = body.bookingId ? Number(body.bookingId) : null;
           if (!bookingId || isNaN(bookingId)) {
               throw new Error("Booking ID is required and must be a number.");
           }
      } catch (e) {
           return NextResponse.json({ error: 'Invalid request body: Booking ID is required.' }, { status: 400 });
      }
      console.log(`Attempting to cancel booking ID: ${bookingId}`);

      // 3. Find the Booking and Verify Permission
      const bookingToCancel = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: {
              hotel: {
                  select: {
                      ownerId: true,
                      name: true // Keep name for notification message
                  }
              },
              roomType: {
                  select: {
                      id: true,
                      name: true // Keep name for notification message
                  }
              },
              // *** FIX: Select firstName and lastName instead of non-existent 'name' ***
              user: { // User who MADE the booking
                  select: {
                      id: true,
                      firstName: true, // Use actual fields from schema
                      lastName: true   // Use actual fields from schema
                      // email: true // Optionally include email if needed
                  }
              }
          }
      });

      // Check if booking exists
      if (!bookingToCancel) {
          return NextResponse.json({ error: `Booking with ID ${bookingId} not found.` }, { status: 404 });
      }

      // Check if already cancelled
      if (bookingToCancel.status === 'cancelled') {
           return NextResponse.json({ message: `Booking ${bookingId} is already cancelled.` }, { status: 200 });
      }

      // *** Authorization Check ***
      const isBookingUser = bookingToCancel.userId === requestingUserId;
      const isHotelOwner = bookingToCancel.hotel.ownerId === requestingUserId;

      if (!isBookingUser && !isHotelOwner) {
           console.warn(`User ${requestingUserId} attempted to cancel booking ${bookingId} without permission.`);
           return NextResponse.json({ error: 'Forbidden: You do not have permission to cancel this booking.' }, { status: 403 });
      }
      console.log(`User ${requestingUserId} authorized to cancel booking ${bookingId} (isBookingUser: ${isBookingUser}, isHotelOwner: ${isHotelOwner})`);


      // 4. Perform Cancellation Transaction
      const [, updatedBooking] = await prisma.$transaction([
           prisma.roomType.update({
               where: { id: bookingToCancel.roomTypeId },
               data: { availableRooms: { increment: 0 } }
           }),
           prisma.booking.update({
               where: { id: bookingId },
               data: { status: 'cancelled' }
           })
      ]);

      console.log(`Booking ${bookingId} successfully cancelled.`);

      // 5. Create Notifications (Using fetched details)
      try { // Wrap notification creation in try-catch to avoid failing the whole request if notification fails
           const guestName = bookingToCancel.user ? `${bookingToCancel.user.firstName} ${bookingToCancel.user.lastName}` : `User ID ${bookingToCancel.userId}`;
           const roomName = bookingToCancel.roomType?.name || 'Unknown Room';
           const hotelName = bookingToCancel.hotel?.name || 'Unknown Hotel';

           const userMessage = `Your booking for ${roomName} at ${hotelName} has been cancelled${isHotelOwner ? ' by the hotel' : ''}.`;
           const ownerMessage = isHotelOwner ?
               `You cancelled a booking for ${roomName} for guest ${guestName}.` :
               `Booking for ${roomName} for guest ${guestName} has been cancelled by the user.`;

           // Notify the user who made the booking
           await prisma.notification.create({
               data: {
                   userId: bookingToCancel.userId,
                   message: userMessage,
                   isRead: false, // Ensure it starts as unread
               },
           });

           // Notify the hotel owner (if they didn't cancel it themselves)
           if (bookingToCancel.hotel.ownerId !== bookingToCancel.userId || !isHotelOwner) { // Notify owner unless they cancelled their own booking (edge case)
              await prisma.notification.create({
                  data: {
                      userId: bookingToCancel.hotel.ownerId,
                      message: ownerMessage,
                      isRead: false,
                  },
              });
           }
            console.log(`Notifications created for booking ${bookingId} cancellation.`);
      } catch (notificationError) {
           console.error(`Failed to create notifications for booking ${bookingId} cancellation:`, notificationError);
           // Continue even if notification fails
      }

      // 6. Return Success Response
      return NextResponse.json({ message: `Booking ${bookingId} cancelled successfully.` }, { status: 200 });

  } catch (error) {
      console.error('Error in DELETE /api/bookings/cancel:', error);
      const message = error.message || 'Failed to cancel booking due to an internal error.';
      const status = error.status || 500;
      return NextResponse.json({ error: message }, { status: status });
  }
}
