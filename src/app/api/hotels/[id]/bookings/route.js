// src/app/api/hotels/[id]/bookings/route.js
import { NextResponse } from "next/server";
import { filterHotelBookingsService } from "../../../../../services/hotelService";
import { verifyToken } from "../../../../../utils/auth";

export async function GET(request, { params }) {
  try {
    const token = verifyToken(request);
    if (!token || token.error) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
    }

    const { id: hotelId } = params;
    const { searchParams } = new URL(request.url);
    const filters = {
      roomTypeId: searchParams.get("roomTypeId"),
      startDate: searchParams.get("startDate"),
      endDate: searchParams.get("endDate")
    };

    const bookings = await filterHotelBookingsService(hotelId, filters);
    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/hotels/bookings:', error);
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
