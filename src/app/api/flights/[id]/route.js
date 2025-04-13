import { apiClient } from "../../../../utils/apiClient";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/*This allows a client to retrieve precise/all the information of a flight based on its id.*/

export async function GET(req, { params }) {
    try {
        const { id } = params;

        if (!id) {
            return new Response(JSON.stringify("Flight ID is required!"), { status: 400 });
        }

        // Fetch flight details using the provided ID
        const url = new URL (`${process.env.AFS_URL}/api/flights/${id}`);
    
        let options = {
            method: "GET",
            headers: {
                    "x-api-key" : process.env.AFS_KEY,
                    "Content-Type": "application/json"
            }
        }
    
        const response = await fetch(url, options);

        if (!response || !response.ok) {
            return new Response(JSON.stringify({ error: 'Flight not found' }), { status: 404 });
        }

        const flightDetails = await response.json();


        return new Response(JSON.stringify(extractFlightDetails(flightDetails)), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify("Error while fetching flight details"), { status: 500 });
    }
}

function extractFlightDetails(flightData) {
    // Extract the relevant data fields
    const flightId = flightData.id;
    const airlineName = flightData.airline.name;
    const Airports = `${flightData.origin.name} → ${flightData.destination.name}`;
    const flightNumber = flightData.flightNumber;
    const availableSeats = flightData.availableSeats;
    const durationInHours = (flightData.duration / 60).toFixed(2); // Convert duration to hours
    const status = flightData.status;
  
    // Return the extracted details in a structured format
    return {
      flightId,
      airlineName,
      Airports,
      flightNumber,
      availableSeats,
      durationInHours,
      status,
    };
  }
