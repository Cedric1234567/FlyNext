/**
 * This code was generated with the help of ChatGPT and it was modified a bit to meet
 * the speciifc requirement and standards. The prompt given was the notifications 
 * description in the assignment and a copy of the User model from the Prisma schema.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = parseInt(searchParams.get("userId"));

    if (!userId){ 
        return new Response(JSON.stringify({ error: "UserId is required" }), { 
            status: 400, headers: { "Content-Type": "application/json" } 
        });
    }

    const count = await prisma.notification.count({
      where: { userId: userId, isRead: false },
    });

    
    return new Response(JSON.stringify({ count: count}), { 
        status: 200, headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch notification count" }), { 
        status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}
