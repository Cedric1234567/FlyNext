import { NextResponse } from "next/server";
import { verifyToken } from "@/utils/auth";
import { PrismaClient } from "@prisma/client";
import { validateCard } from "@/utils/validators";

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const token = verifyToken(request);
        if (!token || (token && token.error)) {
        return NextResponse.json({ error: 'Unauthorized Access' }, { status: 401 });
        }

        console.log(token);
    
        const user = await prisma.user.findUnique({ where: { email: token.userEmail } });
    
        const { cardNumber, expiryDate, cvv, validate, itineraryId } = await request.json();

        if (!cardNumber || !expiryDate || !cvv || typeof validate !== 'boolean' || !itineraryId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        await prisma.itinerary.update({
            where: { id: parseInt(itineraryId)},
            data: {
                finalize: validate
            }
        });

        const cardNum = parseInt(cardNumber);
        const cvv_2 = parseInt(cvv);

        const isCardValid = validateCard(cardNum, expiryDate, cvv_2);

        if (!isCardValid) {
            return NextResponse.json({ error: "Invalid card details" }, { status: 400 });
        }
        return NextResponse.json({ message: "Credit card has been validated" }, { status: 200 });
    } catch (error) {
        console.error("Error in POST /api/bookings/checkout:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}