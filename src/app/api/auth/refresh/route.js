import {  generateToken, verifyTokenRefresh } from "../../../../utils/auth";

export async function POST(request) {
    const { refreshToken } = await request.json();
  
    if (!refreshToken) {
      return new Response(JSON.stringify({ error: "No refresh token provided" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }
  
    try {
      const user = verifyTokenRefresh(request);
      const newAccessToken = generateToken({ userEmail: user.userEmail });
      return new Response(JSON.stringify({ accessToken: newAccessToken }), {status: 200 , headers: { "Content-Type": "application/json" }});
    } catch {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 401, headers: { "Content-Type": "application/json" }});
    }
  }