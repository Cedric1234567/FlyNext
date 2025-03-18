import {apiClient} from "../../../../utils/apiClient";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
/*This allows a client to retrieve precise/all the information of a flight based on its id and of course source/destination/date which allows
us to communicate with the AFS.

HELP OF CHATGPT: Explaining the find and flatMap functions*/
export async function GET(req, {params}) {
    try{
        
        const {id} = await params;
        
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
        
        const final_response= response.results.flatMap(res => res.flights).find(flight => flight.id === id);
        

        if (!final_response){
            return new Response(JSON.stringify({error:'Flight not found'}), {status:400});
        }
        return new Response(JSON.stringify(final_response), {status: 200})
        
    } catch(error){
        return new Response(JSON.stringify("Error while fetching flights"), {status: 500});
    }

}
