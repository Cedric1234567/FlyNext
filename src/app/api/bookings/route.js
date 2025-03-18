import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const token = verifyToken(request);
        if (!token || (token && token.error)) {
        return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
        }
    
        const user = await prisma.user.findUnique({ where: { email: token.userEmail } });
    
        const { hotelBooking, flightBooking } = await request.json();

        if (!hotelBooking && !flightBooking) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const Data = {};
        if (hotelBooking) {
            Data.hotelBooking = hotelBooking;
        }
        if (flightBooking) {
            Data.flightBooking = flightBooking;
        }

        Data.userId = user.id;

        const itinerary = await prisma.itinerary.create({
            data: Data 
        });

        prisma.notification.create({
            data: {
                userId: user.id,
                message: `Itinerary has been created with id ${itinerary.id}`
            }
        });
    
        return NextResponse.json({ itinerary: itinerary }, { status: 200 });
    } catch (error) {
        console.error("Error in POST /api/bookings/:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}