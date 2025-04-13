// src/app/api/hotels/[id]/route.js
// I used copilot for parts of the GET, PATCH and DELETE functions
import { NextResponse } from 'next/server';
import { getHotelById, updateHotel, deleteHotel } from '@/controllers/hotelController';
import { verifyToken } from '../../../../utils/auth';
import { prisma } from '@/prismaClient';

export async function GET(request, { params }) {
  try {
    // Validate that the hotel id is provided
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing hotel id" }, { status: 400 });
    }

    // Extract and validate date filters from the query string
    const { searchParams } = new URL(request.url);
    const checkInDate = searchParams.get("checkInDate");
    const checkOutDate = searchParams.get("checkOutDate");

    // If one date is provided without the other, return an error
    if ((checkInDate && !checkOutDate) || (!checkInDate && checkOutDate)) {
      return NextResponse.json(
        { error: "Both checkInDate and checkOutDate must be provided together" },
        { status: 400 }
      );
    }

    // If both dates are provided, validate their format
    if (checkInDate && checkOutDate) {
      const parsedCheckIn = new Date(checkInDate);
      const parsedCheckOut = new Date(checkOutDate);
      if (isNaN(parsedCheckIn.getTime()) || isNaN(parsedCheckOut.getTime())) {
        return NextResponse.json(
          { error: "Invalid date format for checkInDate or checkOutDate" },
          { status: 400 }
        );
      }
    }

    // Call service function, passing the id and date filters
    const hotel = await getHotelById(id, { checkInDate, checkOutDate });
    
    // If hotel not found, return a 404 error
    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    return NextResponse.json({ hotel }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/hotels/[id]:", error);
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function PATCH(request, { params }) {
  try {
    // Verify the user using the auth utility
    const token = verifyToken(request);
    if (!token || (token && token.error)) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
    }
    
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    const body = await request.json();
    const user = await prisma.user.findUnique({ where: { email: token.userEmail } });
    const updatedHotel = await updateHotel(id, body, user.id);
    return NextResponse.json({ hotel: updatedHotel });
  } catch (error) {
    console.error('Error in PATCH /api/hotels/[id]:', error);
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(request, { params }) {
  try {
    // Verify the user
    const token = verifyToken(request);
    if (!token || (token && token.error)) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
    }
    const user = await prisma.user.findUnique({ where: { email: token.userEmail } });
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Delete the hotel; controller will enforce ownership check
    await deleteHotel(id, user.id);
    return NextResponse.json({ message: 'Hotel deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/hotels/[id]:', error);
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
