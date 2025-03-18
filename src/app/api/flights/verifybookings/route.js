import {apiClient} from "../../../../utils/apiClient";
import { verifyToken } from '../../../../utils/auth';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
/*This endpoint allows a user to verify the status of his/her booking and gain some information such as the flight number departure time, 
arrival time for each flight of the booking. */
export async function GET(req){
    try{
        
        const token = verifyToken(req);
        if (!token || (token && token.error)){
            return new Response(JSON.stringify({error:'Unauthorized Access'}), {status: 401 });
        }
        
        const user = await prisma.user.findUnique({where: {email: token.userEmail}}); 
        
        const searchParams = req.nextUrl.searchParams;
        const {bookingReference} = Object.fromEntries(searchParams.entries());

        const filters = {}
        if (!bookingReference){
            return new Response(JSON.stringify({error: 'No booking reference added'}), {status: 400});
        }

        filters.lastName = user.lastName;
        filters.bookingReference = bookingReference;
        const response = await apiClient('/api/bookings/retrieve', "GET", filters);

        const verif_booking = response.flights.map(flight => ({
            flightNumber: flight.flightNumber,
            status: flight.status,
            originCity: flight.origin.city,
            destinationCity: flight.destination.city,
            departureTime: flight.departureTime,
            arrivalTime: flight.arrivalTime
          }));
        return new Response(JSON.stringify(verif_booking), {status: 200});
    }catch (error){
        return new Response(JSON.stringify({error: 'No flight bookings could be retrieved'}), {status: 400});
    }
}