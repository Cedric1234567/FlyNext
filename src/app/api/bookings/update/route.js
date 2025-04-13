import { PrismaClient } from "@prisma/client";
import { hashPassword,verifyToken } from "../../../../utils/auth";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function PATCH(request) {
    const token = verifyToken(request);

    if (!token) {
        return NextResponse.json(
        {
            error: "Unauthorized",
        },
        { status: 401 },
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const itineraryId = parseInt(searchParams.get("itineraryId"));
        const { hotelBooking, flightBooking } = await request.json();

        // const { email, firstName, lastName, phoneNumber, profilePicture, password } = await request.json();
        if (!flightBooking && !hotelBooking) {
            return new Response("No fields to update", { status: 400 });
        }

        const updateData = {};
        if (flightBooking) {
            updateData.flightBooking = flightBooking;
        }
        if (hotelBooking) {
            updateData.hotelBooking = hotelBooking; 
        }  

        console.log("Update data",updateData);

        const itinerary = await prisma.itinerary.update({
            where: { id: itineraryId },
            data: updateData,
        });
  
      return new Response(JSON.stringify({ message: "Itinerary updated" , itinerary : itinerary}), { 
          status: 200, headers: { "Content-Type": "application/json" } 
      });
    } catch (error) {
        console.log(error)
      return new Response(JSON.stringify({ error: "Itinerary failed to update" }), { 
          status: 500, headers: { "Content-Type": "application/json" } 
      });
    }
  }
  