import {apiClient, apiClientpost} from "../../../../utils/apiClient";
import { verifyToken } from '../../../../utils/auth';
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/*
This is the endpoint which allows a user to create a booking in the AFS.
We first verify that the client is a correct user find that user in  the database and based on the request's
body we create a booking.
*/
export async function POST(req){
    try{
        
        const token = verifyToken(req);
        if (!token || (token && token.error)){
            return new Response(JSON.stringify({error:'Unauthorized Access'}), {status: 401 });
        }
        
      
        
        const user = await prisma.User.findUnique({where: {email: token.userEmail}}); 

        const {flightIds, passportNumber} = await req.json();

        if(!flightIds?.length || !passportNumber){
            return new Response(JSON.stringify({error: 'Missing flightIds and/or passport number'}), {status: 400});
        }
        
        const data = {
            email: user.email,
            firstName: user.firstName,
            flightIds,
            lastName: user.lastName,
            passportNumber
        }
        

        const response = await apiClient("/api/bookings", "POST", data);
        console.log("API", response);
        return new Response(JSON.stringify(response), {status: 200});

    }catch (error){
        console.log(error);
        return new Response(JSON.stringify({error: 'Flight couldn"t be booked'}), {status: 400});
    }
}
