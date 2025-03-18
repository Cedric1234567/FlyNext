// app/api/hotels/[id]/room-types/[roomTypeId]/route.js
// copilot used in DELETE
import { NextResponse } from "next/server";
import { updateRoomTypeService, deleteRoomTypeService } from "../../../../../../services/hotelService";
import { verifyToken } from "../../../../../../utils/auth";

export async function PATCH(request, { params }) {
  try {
    const token = verifyToken(request);
    if (!token || (token && token.error)) {
      return NextResponse.json({ error: "Unauthorized Access" }, { status: 401 });
    }
    const { id: hotelId, roomTypeId } = params;
    const body = await request.json();
    // user.id is provided via the token lookup
    const user = await prisma.user.findUnique({ where: { email: token.userEmail } });
    const updatedRoomType = await updateRoomTypeService(hotelId, roomTypeId, body, user.id);
    return NextResponse.json({ roomType: updatedRoomType }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = verifyToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: token.userEmail } });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Await the params to destructure id and roomTypeId
    const { id, roomTypeId } = await params;
    if (!id || !roomTypeId) {
      console.error("Missing required fields");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    console.log("USER ID: ", user.id);
    await deleteRoomTypeService(id, roomTypeId, user.id);
    
    return NextResponse.json({ message: "Room type deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.status || 500 });
  }
}