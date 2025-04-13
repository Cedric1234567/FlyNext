import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../../../../utils/auth";

const prisma = new PrismaClient();

export async function POST(request) {
    const { firstName, lastName, email, phoneNumber, password} = await request.json();
    if (!firstName || !password || !email || !phoneNumber) { 
      return new Response(JSON.stringify({ error: "All the required fields needs to be filled in to create an account" }), { status: 400 });
    }
    // console.log("Jarvis");
  
    try {
        // console.log("Bye");
      const user = await prisma.user.create({ 
          data: { 
              firstName,
              lastName,
              email, 
              phoneNumber,
              password: await hashPassword(password), 
          }, 
      });

      console.log("Hello");
      return new Response(JSON.stringify({ message: "User registered successfully", user: user}), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (error) {
        console.log(error);
      return new Response(JSON.stringify({ error: "User registration failed" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
  }