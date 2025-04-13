import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { verifyToken } from '@/utils/auth';
import { cancelBookingService } from "@/services/bookingService";

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const token = verifyToken(request);
        if (!token || (token && token.error)) {
            return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
        }
    
        const user = await prisma.user.findUnique({ where: { email: token.userEmail } });
    
        const { itineraryId, hotelBooking, flightBooking } = await request.json();

        if (!hotelBooking && !flightBooking && !itineraryId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }
        
        let booking = null;

        if (hotelBooking) {
            const bookingCancel = await prisma.itinerary.findUnique({ where: { id: parseInt(itineraryId) } });
            const bookingid = parseInt(bookingCancel.hotelBooking);
            cancelBookingService(bookingid, user.id);
            prisma.notification.create({
                data: {
                    userId: user.id,
                    message: `Hotel booking has been cancelled for the itinerary with booking id ${bookingid}`
                }
            });
            booking = await prisma.booking.findUnique({ where: { id: bookingid } });
            if (!booking) {
                return NextResponse.json({ error: "Invalid booking id" }, { status: 400 });
            }
        }
    
        return NextResponse.json({ message: "Booking has been cancelled", hotelBooking: booking }, { status: 200 });
    } catch (error) {
        console.error("Error in POST /api/bookings/cancel:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}