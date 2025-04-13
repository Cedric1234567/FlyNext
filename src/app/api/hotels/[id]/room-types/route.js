// app/api/hotels/[id]/room-types/route.js
// Generated with copilot
import { NextResponse } from "next/server";
import { createRoomTypeService } from "../../../../../services/hotelService";
import { verifyToken } from "../../../../../utils/auth";
import { prisma } from '@/prismaClient';

export async function POST(request, { params }) {
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

    // Extract hotel ID from params and validate it
    const { id: hotelId } = params;
    if (!hotelId || isNaN(Number(hotelId))) {
      return NextResponse.json({ error: 'Invalid hotel id' }, { status: 400 });
    }
    
    // Parse the request body
    const body = await request.json();
    if (!body) {
      return NextResponse.json({ error: 'Missing room type data' }, { status: 400 });
    }
    // Validate required fields
    if (!body.name || body.pricePerNight == null || body.availableRooms == null) {
      return NextResponse.json(
        { error: "Missing required fields: name, pricePerNight, availableRooms" },
        { status: 400 }
      );
    }

    // Create the room type using the service
    const newRoomType = await createRoomTypeService(hotelId, body, user.id);

    return NextResponse.json({ roomType: newRoomType }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/hotels/[id]/room-types:", error);
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}
