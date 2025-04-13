// src/app/api/hotels/[id]/bookings/route.js
import { NextResponse } from "next/server";
import { filterHotelBookingsService } from "../../../../../services/hotelService";
import { verifyToken } from "../../../../../utils/auth";
import { prisma } from '@/prismaClient'; // Import Prisma client

export async function GET(request, { params }) {
  try {
// Verify authentication
    const token = verifyToken(request);
    if (!token || token.error) {
      return NextResponse.json(
        { error: 'Unauthorized Access: Invalid or missing token' },
        { status: 401 }
      );
    }

    // Look up the user using token data
    const user = await prisma.user.findUnique({
      where: { email: token.userEmail },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { id: hotelId } = params;
    const { searchParams } = new URL(request.url);
    const filters = {
      roomTypeId: searchParams.get("roomTypeId"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate")
    };

    const bookings = await filterHotelBookingsService(hotelId, filters, user.id);
    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/hotels/bookings:', error);
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
