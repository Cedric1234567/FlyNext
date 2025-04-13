import { PrismaClient } from "@prisma/client";
import { comparePassword, generateToken, generateTokenRefresh } from "../../../../utils/auth";

const prisma = new PrismaClient();

export async function POST(request) {
    const { email, password } = await request.json();

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
        return new Response(JSON.stringify({ error: "Email and password are required" }), { 
            status: 400,headers: { "Content-Type": "application/json" } 
        });
    }
    const user = await prisma.user.findUnique({ 
        where: { email }, 
    });


    if (!user || !(await comparePassword(password, user.password))){ 
        return new Response(JSON.stringify({ error: "Invalid credentials" }), { 
            status: 401,headers: { "Content-Type": "application/json" } 
        });
    }

    const payload = { userEmail: user.email };

    const accessToken = generateToken(payload);
    const refreshToken = generateTokenRefresh(payload);

    await prisma.user.update({
        where: { email: user.email },
        data: { refreshToken: refreshToken },
    });

    return new Response(JSON.stringify({ "accessToken":accessToken, "refreshToken":refreshToken }), {
        headers: { "Content-Type": "application/json" }
    });
}