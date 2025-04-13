// src/app/api/hotels/my-hotels/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/prismaClient'; // Import Prisma client
import { verifyToken } from '../../../../utils/auth'; // Import your token verification utility

export async function GET(request) {
    console.log("GET request received for /api/hotels/my-hotels");
    try {
        // 1. Verify Authentication Token & Get Payload
        const tokenPayload = verifyToken(request);

        console.log("Verifying token payload...");
        if (!tokenPayload) {
            console.error("Auth Error in /my-hotels: Token payload is null or undefined");
            return NextResponse.json({ error: 'Unauthorized Access: Missing Token' }, { status: 401 });
        }
        
        if (tokenPayload.error) {
            console.error("Auth Error in /my-hotels: Token verification failed:", tokenPayload.error);
            return NextResponse.json({ error: 'Unauthorized Access: Invalid Token' }, { status: 401 });
        }
        
        if (!tokenPayload.userEmail) {
            console.error("Auth Error in /my-hotels: Token missing required userEmail field");
            console.log("Token payload received:", JSON.stringify(tokenPayload, null, 2));
            return NextResponse.json({ error: 'Unauthorized Access: Incomplete Token Data' }, { status: 401 });
        }
        
        console.log("Token validation successful:", { 
            hasUserEmail: !!tokenPayload.userEmail,
            tokenExpiry: tokenPayload.exp ? new Date(tokenPayload.exp * 1000).toISOString() : 'unknown'
        });

        const userEmail = tokenPayload.userEmail; // Extract email
        console.log(`Token verified for email: ${userEmail}`);

        // --- FIX: Find User by Email to get userId ---
        const user = await prisma.user.findUnique({
            where: {
                email: userEmail,
            },
            select: { // Only select the ID, no need for other user data here
                id: true,
            }
        });

        // Handle case where user from token doesn't exist in DB anymore
        if (!user) {
             console.error(`Auth Error in /my-hotels: User with email ${userEmail} not found in database.`);
             return NextResponse.json({ error: 'Unauthorized Access: User not found' }, { status: 401 }); // Or 404 maybe
        }

        const userId = user.id; // Get the actual user ID
        console.log(`Fetching hotels for resolved ownerId: ${userId}`);

        // 2. Fetch Hotels from Database using the resolved userId
        const hotels = await prisma.hotel.findMany({
            where: {
                ownerId: userId, // Filter by the authenticated user's ID
            },
            orderBy: {
                createdAt: 'desc', // Optional: order by creation date
            },
             // Include necessary fields for the list/card view
             // Example: Select fields matching HotelSearchResult type might be efficient
             select: {
                 id: true,
                 name: true,
                 location: true,
                 starRating: true,
                 images: true, // Needed to select mainImage later
                 // You CANNOT easily calculate startingPrice here with select.
                 // EITHER return full Hotel object with RoomTypes OR modify service further.
                 // Let's return full Hotel for now, frontend can adapt if needed.
                 // If returning full Hotel, just remove the 'select' block entirely.
             }
        });

        // --- FIX: Process results IF you used 'select' to match HotelSearchResult ---
        // If you didn't use 'select' above, skip this processing step.
        const processedHotels = hotels.map(hotel => ({
             ...hotel,
             mainImage: (Array.isArray(hotel.images) && hotel.images.length > 0) ? hotel.images[0] : null,
             // startingPrice would ideally be calculated here too if not returning full rooms,
             // but that requires fetching room prices - gets complex with just 'select'.
             startingPrice: null // Placeholder if not returning full rooms
        }));

        console.log(`Found ${hotels.length} hotels for ownerId: ${userId}`);

        // 3. Return the Found Hotels
        // Return processedHotels if you used 'select', otherwise return 'hotels'
        return NextResponse.json({ hotels: processedHotels }); // Or return NextResponse.json({ hotels }); if no 'select'

    } catch (error) {
        console.error('Error in GET /api/hotels/my-hotels:', error);
        // Handle Prisma errors specifically if needed
        if (error.code) { // Prisma error codes
             return NextResponse.json({ error: 'Database error occurred' }, { status: 500 });
        }
        return NextResponse.json({ error: 'Failed to fetch user hotels' }, { status: 500 });
    }
}