/**
 * This code was taken from ChaptGPT and modified a bit. ChatGPT was given the prompt: 
 * I want to implement the signout as a post method {and it was given the prompt 
 * with my origingal login code}.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request) {
    try {
        const { userId } = await request.json();
        if (!userId) {
            return new Response(JSON.stringify({ error: "No userId provided" }), { 
                status: 401, headers: { "Content-Type": "application/json" } 
            });
        }
        const id = parseInt(userId);
        await prisma.user.update({
            where: { id: id },
            data: { refreshToken: null },
        });
        return new Response(JSON.stringify({ message: "User logged out successfully" }), { 
            status: 200, headers: { "Content-Type": "application/json" } 
        });
    } catch (error) {
        console.log(error);
        return new Response(JSON.stringify({ error: "Logout error" }), { 
            status: 400, headers: { "Content-Type": "application/json" } 
        });
    }
}