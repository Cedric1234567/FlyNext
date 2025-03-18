import { PrismaClient } from "@prisma/client";
import { hashPassword,verifyToken } from "../../../../utils/auth";

const prisma = new PrismaClient();

export async function PATCH(request) {
    const token = verifyToken(request);

    if (!token) {
        return NextResponse.json(
        {
            error: "Unauthorized",
        },
        { status: 401 },
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const userId = parseInt(searchParams.get("userId"));
        const { email, firstName, lastName, phoneNumber, profilePicture, password } = await request.json();
        if (!firstName && !lastName && !phoneNumber && !profilePicture && !password && !email) {
            return new Response("No fields to update", { status: 400 });
        }

        const updateData = {};
        if (firstName) {
            updateData.firstName = firstName;
        }
        if (lastName) {
            updateData.lastName = lastName; 
        }  
        if (phoneNumber) {
            updateData.phoneNumber = phoneNumber;
        }
        if (profilePicture) {
            updateData.profilePicture = profilePicture;
        }
        if (password) {
            updateData.password = await hashPassword(password);
        }
        if (email) {
            updateData.email = email;
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: updateData,
        });
  
      return new Response(JSON.stringify({ message: "User updated" , user : user}), { 
          status: 200, headers: { "Content-Type": "application/json" } 
      });
    } catch (error) {
        console.log(error)
      return new Response(JSON.stringify({ error: "User failed to update" }), { 
          status: 500, headers: { "Content-Type": "application/json" } 
      });
    }
  }
  