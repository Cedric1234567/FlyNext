import { PrismaClient } from "@prisma/client";
import { verifyToken } from '../../../../utils/auth';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(req) {
  try {

    const token = verifyToken(req);
    if (!token || (token && token.error)) {
      return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
    }

    // Validate that the token contains the required user information
    if (!token.userEmail) {
      return NextResponse.json({ error: 'Token is missing required user information like an email.' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: token.userEmail } });

    if (!user){ 
        return new Response(JSON.stringify({ error: "User not found" }), { 
            status: 400, headers: { "Content-Type": "application/json" } 
        });
    }
    const itinerary = await prisma.itinerary.findMany({
      where: { userId: user.id}
    });

    console.log("Itinerary",itinerary);

    return new Response(JSON.stringify(itinerary || {}), { 
        status: 200, headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch itinerary" }), { 
        status: 400, headers: { "Content-Type": "application/json" } 
    });
  }
}