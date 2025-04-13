import { filterHotelBookingsService } from "@/services/bookingService";
import {apiClient} from "@/utils/apiClient";
import { verifyToken } from '@/utils/auth';

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(request){
    try{
        const token = verifyToken(request);
        if (!token || (token && token.error)){
            return new Response(JSON.stringify({error:'Unauthorized Access'}), {status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const { bookingId } = Object.fromEntries(searchParams.entries());
        console.log("Booking ID",bookingId);

        if(!bookingId){
            return new Response(JSON.stringify({error: "Missing required fields"}), {status: 400});
        }

        const booking = await prisma.booking.findUnique({where: {id: parseInt(bookingId)}});
        console.log("Booking",booking);
        if(!booking){
            return new Response(JSON.stringify({error: "Error retriving booking"}), {status: 400});
        }
        const hotel = await prisma.hotel.findUnique({
            where: { id: booking.hotelId },
        });
    
        const roomType = await prisma.roomType.findUnique({
            where: { id: booking.roomTypeId },
        });

        return new Response(JSON.stringify({hotelName: hotel.name, hotelLocation: hotel.location, roomType: roomType.name, status: booking.status}), {status: 200});
    }catch (error){
        console.log(error);
        return new Response(JSON.stringify({error: "Error while fetching bookings"}), {status: 400});
    }
}