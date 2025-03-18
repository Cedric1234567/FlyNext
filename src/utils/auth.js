/* This code was taken from lecture 5 code but it was modified a bit. 
Here is a link to the lecture code for reference: https://replit.com/@kianoosh76/CSC309H5-W5#utils/auth.js
*/

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export function hashPassword(password) {
    return bcrypt.hash(password, parseInt(process.env.BCRYPT_ROUNDS));
}

export function comparePassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword);
}

export function generateToken(object){
    return jwt.sign(object, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRY });
}

export function generateTokenRefresh(object){
    return jwt.sign(object, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRY });
}

export function verifyToken(request) {
    const authorization = request.headers.get("authorization");
  
    if (!authorization) {
        return new Response(JSON.stringify({
             error: "Unauthorized Access" 
            }), 
            { status: 400, 
                headers: { "Content-Type": "application/json" } 
            });
    }
  
    const token = authorization.replace("Bearer ", "");
  
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return null;
    }
  }

  export function verifyTokenRefresh(request) {
    const authorization = request.headers.get("authorization");
  
    if (!authorization) {
        return new Response(JSON.stringify({
             error: "Unauthorized Access" 
            }), 
            { status: 400, 
                headers: { "Content-Type": "application/json" } 
            });
    }
  
    const token = authorization.replace("Bearer ", "");
  
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return null;
    }
  }