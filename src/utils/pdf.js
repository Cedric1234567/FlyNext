/**
 * This code was generated with tby CHatGPT to generate a pdf full of the booking info and details.
 */
import PDFDocument from "pdfkit";
import { Readable } from "stream";
import path from "path";
import fs from "fs";

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function generateInvoice(booking,flight) {
    const stream = new (class CustomReadable extends Readable {
        _read(size) {
          // No-op, since we're directly pushing chunks of the PDF
        }
      })();

    const doc = new PDFDocument({font : 'Times-Roman'});
    
    // let fontPath = path.join(__dirname, "/../fonts/times.ttf");
    // console.log("Font path:", fontPath);

    // if (!fs.existsSync(fontPath)) {
    //     console.error("Font file not found at:", fontPath);
    // } else {
    //     console.log("Font file found at:", fontPath);
    // }

    // doc.font(fontPath);

    // doc.font("Times-Roman");
    
    doc.fontSize(20).text("Trip Booking Invoice", { align: "center" });
  
    // Pipe document data to the stream
    doc.on("data", (chunk) => stream.push(chunk));
    doc.on("end", () => stream.push(null));
    doc.moveDown();

    //doc.fontSize(12).text(`Booking ID: ${booking.id}`);
    doc.moveDown();

    let totalPrice = 0;

    if (flight) {
        doc.text("Flight Details:", { underline: true });
        doc.text(`Booking Reference: ${flight.bookingReference}`);
        flight.flights.forEach(flight => {
            totalPrice += flight.price;
            doc.text(`Flight: ${flight.flightNumber}`);
            doc.text(`Price: $${flight.departureTime}`);
            doc.text(`Price: $${flight.arrivalTime}`); 
            doc.moveDown();
        });
        doc.moveDown();
    }

    if (booking && booking.status !== "cancelled") {
        const hotel = await prisma.hotel.findUnique({
        where: { id: booking.hotelId },
        });

        const roomType = await prisma.roomType.findUnique({
        where: { id: booking.roomTypeId },
        });
        const checkInDate = new Date(booking.checkInDate);
        const checkOutDate = new Date(booking.checkOutDate);

        const numberOfDays = Math.ceil(
            (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
        );
        totalPrice += roomType.pricePerNight * numberOfDays;
        doc.text("Hotel Details:", { underline: true });
        doc.text(`Hotel Name: ${hotel.name}`);
        doc.text(`Location: ${hotel.address}`);
        doc.text(`Check-in: ${checkInDate}`);
        doc.text(`Check-out: ${checkOutDate}`);
        doc.text(`Room Type: ${roomType.name}`);
        doc.text(`Price per night: $${roomType.pricePerNight}`);
        doc.text(`Price for rooms: $${roomType.pricePerNight * numberOfDays}`);
        doc.moveDown();
    }

   doc.text(`Total Price: $${totalPrice}`, { bold: true });
   doc.moveDown();

    doc.text("Thank you for booking with us!", { align: "center" });

    doc.end();
    return stream;
}
