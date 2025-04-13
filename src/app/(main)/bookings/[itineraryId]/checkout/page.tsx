/**
* This code was generated with the help of ChatGPT and it was modified a bit to meet
* the speciifc requirement and standards. The prompt given was the bookings user story
* from the assignment.
*/

'use client';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";

interface FlightBooking {
    bookingReference: string;
    airline: string;
    departure: string;
    arrival: string;
  }
  
  interface HotelBooking {
    checkInDate: string;
    checkOutDate: string;
  }

  interface HotelBooking2{
    hotelName: string; 
    hotelLocation: string; 
    roomType: string;
    status: string;

  }

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const { user, refreshAccessToken, isTokenExpired } = useAuth();
  const [flightBooking, setFlightBooking] = useState<FlightBooking | null>(null);
  const [hotelBooking, setHotelBooking] = useState<HotelBooking | null>(null);
  const [hotelBooking2, setHotelBooking2] = useState<HotelBooking2 | null>(null);
  const [validated, setValidated] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState<string | null>(null);
  const itineraryId = Array.isArray(params.itineraryId) ? params.itineraryId[0] : params.itineraryId;
  
  useEffect(() => {
    if (!itineraryId) return;

    async function fetchBookings() {
      let token = localStorage.getItem('accessToken');
      if (!token) {
          setError("No access token found. Please log in again.");
          return;
      }
      if(isTokenExpired(token)) {
          await refreshAccessToken();
          token = localStorage.getItem('accessToken');
      }
      try {
        const response = await fetch(`/api/bookings/view?itineraryId=${itineraryId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        console.log("Bookings data:", data);
        console.log("Bookings2 data:", response);
        if (response.ok) {
          setFlightBooking(data.flightBooking || null);
          setHotelBooking(data.hotelBooking || null);
        } else {
          setError(data.error || "Failed to fetch bookings");
        }

        const response2 = await fetch(`/api/hotels/bookings/find?bookingId=${data.hotelBooking.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data2 = await response2.json();
          console.log("Hotel Booking data:", data2);
          console.log("Hotel Booking2 data:", response2);
          if (response2.ok) {
            if (data2.status ==="cancelled"){
                setHotelBooking2(null);
                setHotelBooking(null);
            } else {
                setHotelBooking2(data2 || null);
            }
          } else {
            setError(data.error || "Failed to fetch bookings");
          }
      } catch (err) {
        setError("Error fetching bookings");
      }
    }

    fetchBookings();
  }, [itineraryId]);

  async function validateItinerary() {
    let token = localStorage.getItem('accessToken');
      if (!token) {
          setError("No access token found. Please log in again.");
          return;
      }
      if(isTokenExpired(token)) {
          await refreshAccessToken();
          token = localStorage.getItem('accessToken');
      }
    try {
      const response = await fetch("/api/bookings/validate", {
        method: "POST",
        headers: {
             "Content-Type": "application/json",
             'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ validate: true, itineraryId: itineraryId })
      });
      const data = await response.json();
      if (response.ok) {
        setValidated(true);
      } else {
        setError(data.error || "Validation failed");
      }
    } catch (error) {
      setError("Error validating itinerary");
    }
  }

  async function handlePayment() {
    try {
        let token = localStorage.getItem('accessToken');
      if (!token) {
          setError("No access token found. Please log in again.");
          return;
      }
      if(isTokenExpired(token)) {
          await refreshAccessToken();
          token = localStorage.getItem('accessToken');
      }
      const response = await fetch("/api/bookings/checkout", {
        method: "POST",
        headers: {
             "Content-Type": "application/json",
             'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          cardNumber,
          expiryDate,
          cvv,
          itineraryId: itineraryId
        })
      });
      const data = await response.json();
      if (response.ok) {
        alert("Payment successful!");
        router.push(`confirmation`);
      } else {
        setError(data.error || "Payment failed");
      }
    } catch (error) {
      setError("Error processing payment");
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      {error && <p className="text-red-500">{error}</p>}
      <div className="p-4 border rounded-lg shadow mb-4">
        <h2 className="text-xl font-semibold">Itinerary Summary</h2>
        {flightBooking && (
          <p>Flight: {flightBooking.airline} - {flightBooking.departure} to {flightBooking.arrival}</p>
        )}
        {hotelBooking && hotelBooking2 && (
          <p>
          Hotel: {hotelBooking2.hotelName}<br />
          Location: {hotelBooking2.hotelLocation}<br />
          Room Type: {hotelBooking2.roomType}<br />
          Check-in: {new Date(hotelBooking.checkInDate).toLocaleDateString()}<br />
          Check-out: {new Date(hotelBooking.checkOutDate).toLocaleDateString()}
        </p>        
        )}
        <Button onClick={validateItinerary} variant="default" className="mt-2" disabled={validated}>
          {validated ? "Itinerary Validated" : "Validate Itinerary"}
        </Button>
      </div>
      <div className="p-4 border rounded-lg shadow">
        <h2 className="text-xl font-semibold">Payment Details</h2>
        <input
          type="text"
          placeholder="Card Number"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          className="block w-full p-2 border rounded mt-2"
        />
        <input
          type="text"
          placeholder="Expiry Date (MM/YY)"
          value={expiryDate}
          onChange={(e) => setExpiryDate(e.target.value)}
          className="block w-full p-2 border rounded mt-2"
        />
        <input
          type="text"
          placeholder="CVV"
          value={cvv}
          onChange={(e) => setCvv(e.target.value)}
          className="block w-full p-2 border rounded mt-2"
        />
        <Button onClick={handlePayment} variant="default" className="mt-4" disabled={!validated}>
          Confirm Payment
        </Button>
      </div>
    </div>
  );
}
