// src/app/api/hotels/index/route.js
// Copilot was used in the GET and POST functions
import { NextResponse } from 'next/server';
import { listHotels, createHotel } from '../../../../controllers/hotelController';
import { verifyToken } from '../../../../utils/auth';
import { prisma } from '@/prismaClient';

// GET request generated with copilot
export async function GET(request) {
  console.log("GET request received in /api/hotels");
  // Log the request URL for debugging
  console.log("Request URL:", request.url);
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const city = searchParams.get('city');
    const checkInDate = searchParams.get('checkInDate');
    const checkOutDate = searchParams.get('checkOutDate');
    const name = searchParams.get('name');
    const starRating = searchParams.get('starRating');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const amenities = searchParams.get('amenities');
    const roomTypeId = searchParams.get('roomTypeId');
    const roomTypeName = searchParams.get('roomTypeName');
    
    // Validate date parameters if provided
    if (checkInDate && isNaN(new Date(checkInDate).getTime())) {
      return NextResponse.json({ error: 'Invalid checkInDate format' }, { status: 400 });
    }
    if (checkOutDate && isNaN(new Date(checkOutDate).getTime())) {
      return NextResponse.json({ error: 'Invalid checkOutDate format' }, { status: 400 });
    }
    
    // Validate numeric parameters
    if (starRating && isNaN(Number(starRating))) {
      return NextResponse.json({ error: 'Invalid starRating value' }, { status: 400 });
    }
    if (minPrice && isNaN(Number(minPrice))) {
      return NextResponse.json({ error: 'Invalid minPrice value' }, { status: 400 });
    }
    if (maxPrice && isNaN(Number(maxPrice))) {
      return NextResponse.json({ error: 'Invalid maxPrice value' }, { status: 400 });
    }
    if (roomTypeId && isNaN(Number(roomTypeId))) {
      return NextResponse.json({ error: 'Invalid roomTypeId value' }, { status: 400 });
    }
    
    // Build the filters object
    const filters = {
      city,
      checkInDate,
      checkOutDate,
      name,
      starRating,
      minPrice,
      maxPrice,
      amenities,
      roomTypeId,
      roomTypeName,
    };

    // Call the controller/service to list hotels
    const hotels = await listHotels(filters);
    //print length of hotels
    console.log("Number of hotels found:", hotels.length);
    return NextResponse.json({ hotels });
  } catch (error) {
    console.error('Error in GET /api/hotels:', error);
    // For unexpected errors, return a 500 with a generic message.
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}


export async function POST(request) {
  try {
    const token = verifyToken(request);
    console.log("Decoded token:", token);
    if (!token || token.error) {
      return NextResponse.json({ error: 'Unauthorized Access: Invalid or missing token' }, { status: 401 });
    }
    if (!token.userEmail) {
      return NextResponse.json({ error: 'Unauthorized Access: Token missing required user information' }, { status: 401 });
    }
    
    // Parse the request body for hotel details.
    const body = await request.json();

    // Validate required fields: name, address, location, and images.
    const { name, address, location, images } = body;
    if (!name || !address || !location || !images) {
      return NextResponse.json(
        { error: 'Missing required hotel fields: name, address, location, and images' },
        { status: 400 }
      );
    }
    
    if (body.starRating && isNaN(Number(body.starRating))) {
      return NextResponse.json(
        { error: 'Invalid starRating value' },
        { status: 400 }
      );
    }
    
    // Retrieve the user from the database using the token
    const user = await prisma.user.findUnique({ where: { email: token.userEmail } });
    if (!user) {
      return NextResponse.json({ error: 'User not found. Please register and try again.' }, { status: 404 });
    }
    
    // Create a new hotel using the  user's id as the owner.
    const newHotel = await createHotel(body, user.id);
    return NextResponse.json({ hotel: newHotel }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/hotels:', error);
    const status = error.status || 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}