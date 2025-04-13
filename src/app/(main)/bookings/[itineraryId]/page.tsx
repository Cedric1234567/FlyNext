/**
* This code was generated with the help of ChatGPT and it was modified a bit to meet
* the speciifc requirement and standards. The prompt given was the bookings user story
* from the assignment.
*/

'use client';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/utils/apiClient";
import { useAuth } from "@/contexts/AuthContext";
import { set } from "react-hook-form";

interface FlightBooking {
  bookingReference: string;
  airline: string;
  departure: string;
  arrival: string;
}

interface HotelBooking {
  hotelName: string;
  checkInDate: string;
  checkOutDate: string;
}

interface HotelBooking2{
    hotelName: string; 
    hotelLocation: string; 
    roomType: string;

}
interface BookingInfo{
    status: string;
}

interface FlightBookingInfo{
    status: string; 
}

export default function ItineraryPage() {
  const router = useRouter();
  const params = useParams();
  const [flightBooking, setFlightBooking] = useState<FlightBooking | null>(null);
  const [hotelBooking, setHotelBooking] = useState<HotelBooking | null>(null);
  const [hotelBooking2, setHotelBooking2] = useState<HotelBooking2 | null>(null);
  const [BookingInfo, setBookingInfo] = useState<string | null>(null);
  const [FlightBookingInfo, setFlightInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshAccessToken, isTokenExpired } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const itineraryId = Array.isArray(params.itineraryId) ? params.itineraryId[0] : params.itineraryId;

  useEffect(() => {
    setToken(localStorage.getItem('accessToken'));
    }, []);

  useEffect(() => {
    console.log("Fetching itinerary with ID:", itineraryId);
    if (!itineraryId) return;

    const fetchBookings = async() => {
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
            method: "GET",
            headers: { 
                'Authorization': `Bearer ${token}`

            },
        });
        const data = await response.json();
        console.log("Bookings data:", data);
        if (response.ok) {
          setFlightBooking(data.flightBooking || null);
          setHotelBooking(data.hotelBooking || null);
        } else {
          setError(data.error || "Failed to fetch bookings");
        }
        if (data.hotelBooking){
            const response2 = await fetch(`/api/hotels/bookings/find?bookingId=${data.hotelBooking.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const data2 = await response2.json();
              console.log("Hotel Booking data:", data2);
              console.log("Hotel Booking2 data:", response2);
              if (response2.ok) {
                setHotelBooking2(data2 || null);
              } else {
                setError(data.error || "Failed to fetch bookings");
              }
            setBookingInfo(data.hotelBooking.status);
        }
        if(data.flightBooking){
            setFlightInfo("booked");
        }
        setLoading(false);
      } catch (err) {
        setError("Error fetching bookings");
      } finally {
        setLoading(false);
      }
      setLoading(false);
    }

    fetchBookings();
  }, [itineraryId]);

  async function cancelFlight() {
    if (!flightBooking) return;
    if (!user) { 
        // router.push('/');
        return; 
    }
    if (!token) {
        setError("No access token found. Please log in again.");
        return;
    }
    if(isTokenExpired(token)) {
        await refreshAccessToken();
        setToken(localStorage.getItem('accessToken'));
    }
    try{
        const response = await fetch(`/api/bookings/cancel`, {
            method: "POST",
            headers: { 
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({flightBooking: flightBooking}),
    
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || "Failed to cancel a flight.");
        }
        setFlightInfo("cancelled");
    } catch (error) {
        setError("Error cancelling flight.");
    }
  }

  async function cancelHotel() {
    if (!hotelBooking) return;
    if (!user) { 
        router.push('/');
        return; 
    }
    if (!token) {
        setError("No access token found. Please log in again.");
        return;
    }
    if(isTokenExpired(token)) {
        await refreshAccessToken();
        setToken(localStorage.getItem('accessToken'));
    }
    try{
        const response = await fetch(`/api/bookings/cancel`, {
            method: "POST",
            headers: { 
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({itineraryId: itineraryId, hotelBooking: hotelBooking}),
    
        });
        const data = await response.json();
        console.log(data);
        if (!response.ok) {
            throw new Error(data.error || "Failed to cancel a hotel booking.");
        }
        console.log("Hotel Booking data:", data);
        console.log("Hotel Booking2 data:", response);
        setBookingInfo(data.hotelBooking.status);
    } catch (error) {
        setError("Error cancelling hotel booking.");
    }
  }

  if (loading) return <p className="text-center text-lg">Loading itinerary...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Itinerary Details</h1>
      {flightBooking ? (
        <div className="p-4 border rounded-lg shadow mb-4">
          <h2 className="text-xl font-semibold">Flight Details</h2>
          <p>Airline: {flightBooking.airline}</p>
          <p>Departure: {flightBooking.departure}</p>
          <p>Arrival: {flightBooking.arrival}</p>
          <p>Booking Status: {FlightBookingInfo}</p>
          <Button onClick={cancelFlight} variant="destructive" className="mt-2">Cancel Flight</Button>
        </div>
      ) : <p>No flight booking available.</p>}
      {hotelBooking ? (hotelBooking2 ? (
        <div className="p-4 border rounded-lg shadow mb-4">
          <h2 className="text-xl font-semibold">Hotel Details</h2>
          <p>
          Hotel: {hotelBooking2.hotelName}<br />
          Location: {hotelBooking2.hotelLocation}<br />
          Room Type: {hotelBooking2.roomType}<br />
          Check-in: {new Date(hotelBooking.checkInDate).toLocaleDateString()}<br />
          Check-out: {new Date(hotelBooking.checkOutDate).toLocaleDateString()} <br />
          Booking Status: {BookingInfo}
        </p>
          <Button onClick={cancelHotel} variant="destructive" className="mt-2">Cancel Hotel</Button>
        </div>
      ) : <p>No hotel booking details available.</p>) : <p>No hotel booking available.</p>}
      <Button onClick={() => router.push(`${itineraryId}/checkout`)} variant="default" className="mt-4">
        Proceed to Checkout
      </Button>
    </div>
  );
}
