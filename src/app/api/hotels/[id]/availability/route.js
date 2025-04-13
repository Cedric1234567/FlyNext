// src/app/api/hotels/[id]/availability/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/prismaClient'; // Needed for user lookup
import { verifyToken } from '../../../../../utils/auth'; // Adjust path
import { checkRoomAvailabilityService } from "../../../../../services/hotelService";

export async function GET(request, { params }) {
    const { id } = params;
    const hotelIdNum = Number(id);
     if (isNaN(hotelIdNum)) {
        return NextResponse.json({ error: "Invalid Hotel ID" }, { status: 400 });
    }
    console.log(`GET request for /api/hotels/${hotelIdNum}/availability`);

    try {
        // 1. Auth and User ID
        const tokenPayload = verifyToken(request);
        if (!tokenPayload || tokenPayload.error || !tokenPayload.userEmail) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
         const userEmail = tokenPayload.userEmail;
         const user = await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true }});
         if (!user) return NextResponse.json({ error: 'User not found' }, { status: 401 });
         const userId = user.id;

        // 2. Get Date Filters from Query Params
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get("startDate");
        const endDate = searchParams.get("endDate");

        // 3. Basic Validation (Controller/Service does more)
        if (!startDate || !endDate) {
             return NextResponse.json({ error: 'startDate and endDate query parameters are required' }, { status: 400 });
        }

        // 4. Call Controller
        const availabilityData = await checkRoomAvailabilityService(hotelIdNum, startDate, endDate, userId);

        // 5. Return Response (return the array directly)
        return NextResponse.json(availabilityData); // Return the array, not nested

    } catch (error) {
         console.error(`Error fetching availability for hotel ${params.id}:`, error);
         return NextResponse.json({ error: error.message || 'Failed to fetch availability' }, { status: error.status || 500 });
    }
}