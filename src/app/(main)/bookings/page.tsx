/**
* This code was generated with the help of ChatGPT and it was modified a bit to meet
* the speciifc requirement and standards. The prompt given was the bookings user story
* from the assignment.
*/

'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface Booking {
  id: number;
  hotelBooking: string;
  FlightBooking: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const { user, refreshAccessToken, isTokenExpired } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fetchBookings = async () => {
      let token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found. Please log in again.");
        setLoading(false);
        return;
      }

      if (isTokenExpired(token)) {
        await refreshAccessToken();
        token = localStorage.getItem("accessToken");
      }

      setToken(token);

      try {
        const res = await fetch("/api/bookings/getBooking", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        console.log("Bookings data:", data);

        if (res.ok) {
          setBookings(data || []);
        } else {
          setError(data.error || "Failed to fetch bookings");
        }
      } catch (err) {
        setError("An error occurred while fetching bookings.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleViewDetails = (id: number) => {
    router.push(`/bookings/${id}`);
  };

  if (loading) return <p className="text-center py-8">Loading your bookings...</p>;
  if (error) return <p className="text-center text-red-500 py-8">{error}</p>;

  return (
    <div className="space-y-4">
  {bookings.map((booking) => (
    <div
      key={booking.id}
      className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 flex justify-between items-center"
    >
      <div>
        <h2 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Booking ID
        </h2>
        <p className="text-xl font-semibold text-gray-800">{booking.id}</p>

        <div className="mt-2 text-gray-600 text-sm space-y-1">
          {booking.hotelBooking && (
            <p><span className="font-medium">Hotel Booking:</span> {booking.hotelBooking}</p>
          )}
          {booking.FlightBooking && (
            <p><span className="font-medium">Flight Booking:</span> {booking.FlightBooking}</p>
          )}
        </div>
      </div>

      <button
        onClick={() => handleViewDetails(booking.id)}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-xl transition shadow-sm"
      >
        View Details
      </button>
    </div>
  ))}
</div>
  );
}
