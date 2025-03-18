/**
 * This code was generated with the hlep of COPILOT
 */
import { NextResponse } from 'next/server';
import { verifyToken } from '@/utils/auth';
import { PrismaClient } from '@prisma/client';
import { apiClient } from '../../../../utils/apiClient';
import { generateInvoice } from '@/utils/pdf';

const prisma = new PrismaClient();

export async function GET(request) {
    try{
        const token = verifyToken(request);
        if (!token || (token && token.error)) {
            return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: token.userEmail } });

        const { searchParams } = new URL(request.url);
        const itineraryId = searchParams.get("itineraryId");

        if (!itineraryId) {
            return NextResponse.json({ error: "No itinerary found" }, { status: 404 });
        }

        const itinerary = await prisma.itinerary.findUnique({ where: { id: parseInt(itineraryId) } });
        if (!itinerary) {
            return NextResponse.json({ error: "Invalid itinerary id" }, { status: 400 });
        }

        let booking = null;
        let flight = null;

        if (itinerary.hotelBooking) {
            booking = await prisma.booking.findUnique({ where: { id: itinerary.hotelBooking } });
        }

        if (itinerary.flightBooking) {
            const data = {
                lastName: user.lastName,
                bookingReference: itinerary.flightBooking,
            }
            console.log(data);

            flight = await apiClient("/api/bookings/retrieve","GET", data);
        }

        const pdfStream = generateInvoice(booking, flight);

        return NextResponse.json({url:`invoice-${itinerary.id}.pdf`, message: "PDF Generated" }, { status: 200 });
    } catch (error) {
        console.error("Error in GET /api/bookings/pdf:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }   
}