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

        const user = await prisma.user.findUnique({where: {email: token.userEmail}});

        const searchParams = request.nextUrl.searchParams;
        const { itineraryId } = Object.fromEntries(searchParams.entries());

        if(!itineraryId){
            return new Response(JSON.stringify({error: "Missing required fields"}), {status: 400});
        }

        const itinerary = await prisma.itinerary.findUnique({where: {id: parseInt(itineraryId)}});
        if(!itinerary){
            return new Response(JSON.stringify({error: "Invalid itinerary id"}), {status: 400});
        }

        const filters = {}
        let flightInfo = null;

        if (itinerary.flightBooking){
            filters.lastName = user.lastName;
            filters.bookingReference = itinerary.flightBooking;
            flightInfo = await apiClient('/api/bookings/retrieve',"GET", filters);
        }

        let bookings = null;
        if (itinerary.hotelBooking){
            bookings = await prisma.Booking.findUnique({where: {id: parseInt(itinerary.hotelBooking)}});
        }
        console.log(bookings);

        return new Response(JSON.stringify({hotelBooking: bookings, flightBooking: flightInfo}), {status: 200});
    }catch (error){
        console.log(error);
        return new Response(JSON.stringify({error: "Error while fetching bookings"}), {status: 400});
    }
}