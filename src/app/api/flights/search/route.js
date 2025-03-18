import {apiClient} from "../../../../utils/apiClient";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/* 
This is my endpoint to allow a visitor to search for an existing flight based on a source and destination city or aiport, and
a date. It returns a concise version of the full response of our AFS API that interacts with this endpoint.

HELP OF CHATGPT: Gave me the structure of the code to filter out flight to only display certain fields, using map.
*/
export async function GET(req) {
    try{
        const searchParams = req.nextUrl.searchParams;
        const {source, destination, dates} = Object.fromEntries(searchParams.entries());

        const filters = {};

        if(!source || !destination || !dates){
            return new Response(JSON.stringify("You must enter a value for all fields!"), {status: 400});
        }
        if(source){
            filters.origin = source;
        }

        if(destination){
            filters.destination = destination;
        }

        if(dates){
            filters.date = dates;
        }    
        

    
        const response = await apiClient('/api/flights',"GET" ,filters);
        const final_response= response.results.map((itinerary, index) => {
            const flights = itinerary.flights;
            return {
                id: index + 1,
                flightIds: flights.map(flight => flight.id), 
                departure_time: flights[0].departureTime,
                arrival_time: flights[flights.length - 1].arrivalTime,
                duration: flights.reduce((sum, flight) => sum + flight.duration, 0), 
                layovers: flights.length > 1 
                    ? flights.slice(0, -1).map(f => f.destination.code)
                    : []
            };
        });
        return new Response(JSON.stringify(final_response), {status: 200})
        
    } catch(error){
        return new Response(JSON.stringify({error:"No flights found"}), {status: 400});
    }

}
