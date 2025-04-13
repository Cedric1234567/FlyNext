import {apiClient, apiClientpost} from "../../../../utils/apiClient";
import { verifyToken } from '../../../../utils/auth';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/*
This is the endpoint which allows a user to cancel a flight booking in the AFS.
We first verify that the client is a correct user find that user in  the database and based on the request's
body we cancel a booking.
*/
export async function POST(req){
    try{
        
        const token = verifyToken(req);
        if (!token || (token && token.error)){
            return new Response(JSON.stringify({error:'Unauthorized Access'}), {status: 401 });
        }
        
      
        
        const user = await prisma.User.findUnique({where: {email: token.userEmail}}); 

        const {bookingReference} = await req.json();

        if(!bookingReference){
            return new Response(JSON.stringify({error: 'Missing booking reference'}), {status: 400});
        }
        
        const data = {
            bookingReference,
            lastName: user.lastName
        }
        

        const response = await apiClient("/api/bookings/cancel", "POST", data);
        console.log("APIjj", response);
        console.log("Name", response.firstName);
        

        return new Response(JSON.stringify(response), {status: 200});

    }catch (error){
        console.log(error);
        return new Response(JSON.stringify({error: 'Flight couldn"t be cancelled'}), {status: 400});
    }
}
