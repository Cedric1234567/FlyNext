//src/app/api/hotels/[id]/availability/route.js
// Parts of the GET function where generated with copilot
import { NextResponse } from "next/server";
import { checkRoomAvailabilityService } from "../../../../../services/hotelService";

export async function GET(request, { params }) {
  try {
    // Validate hotelId
    const { id: hotelId } = params;
    if (!hotelId || isNaN(Number(hotelId))) {
      return NextResponse.json(
        { error: "Invalid or missing hotelId" },
        { status: 400 }
      );
    }

    // Extract and validate date filters from the query string
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "startDate and endDate query parameters are required" },
        { status: 400 }
      );
    }

    // Validate that the provided dates are valid
    const parsedStart = new Date(startDate);
    const parsedEnd = new Date(endDate);
    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format for startDate or endDate" },
        { status: 400 }
      );
    }

    // Call the service function
    const availability = await checkRoomAvailabilityService(
      hotelId,
      startDate,
      endDate
    );
    return NextResponse.json({ availability }, { status: 200 });
  } catch (error) {
    console.error("Error in GET /api/hotels/[id]/availability:", error);
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}