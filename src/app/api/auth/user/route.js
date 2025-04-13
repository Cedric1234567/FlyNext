import {  verifyToken } from "../../../../utils/auth";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function POST(request) {
    const { token } = await request.json();
  
    if (!token) {
      return new Response(JSON.stringify({ error: "No refresh token provided" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
  
    try {
      const user = verifyToken(request);
      const userData = await prisma.user.findUnique({ where: { email: user.userEmail } });
      if (!userData) {
        return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ user: userData }), {status: 200 , headers: { "Content-Type": "application/json" }});
    } catch {
      return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: { "Content-Type": "application/json" }});
    }
  }