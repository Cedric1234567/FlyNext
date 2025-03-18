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
    const notifications = await prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: "desc" },
    });

    return new Response(JSON.stringify({ notification: notifications }), { 
        status: 200, headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Failed to fetch notifications" }), { 
        status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}

export async function PATCH(req) {
  try {
    const { searchParams } = new URL(req.url);
    const notificationId = parseInt(searchParams.get("notificationId"));


    if (!notificationId) {
        return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return new Response(JSON.stringify({ message: "Notification marked as read" }), { 
        status: 200, headers: { "Content-Type": "application/json" } 
    });
  } catch (error) {
    console.log(error);
    return new Response(JSON.stringify({ error: "Notification failed to update as read" }), { 
        status: 500, headers: { "Content-Type": "application/json" } 
    });
  }
}
