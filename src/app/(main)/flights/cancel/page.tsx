//AI assistance
"use client";
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const CancelBookingPage: React.FC = () => {
  const [bookingReference, setBookingReference] = useState('');
  const [cancelDetails, setcancelDetails] = useState<any[]>([]); // Updated to handle a list of objects
  const [error, setError] = useState('');
  const { user, refreshAccessToken, isTokenExpired } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  const handleCancel = async () => {
    setError('');
    setcancelDetails([]);

    if (!bookingReference) {
      setError('Booking reference is required.');
      return;
    }

    let accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      setError("You must be logged in.");
      return;
    }

    // Step 2: Check if token is expired, refresh if necessary
    if (isTokenExpired(accessToken)) {
      await refreshAccessToken(); // refresh token
      accessToken = localStorage.getItem("accessToken"); // get the new token
    }

    // If still no valid token, return with an error
    if (!accessToken) {
      setError("Unable to authenticate. Please log in again.");
      return;
    }

    try {
        const response = await fetch('/api/flights/cancel', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              bookingReference
            }),
          });

      console.log("Response:", response);
      

      const data = await response.json();
      console.log("Data:", data);
      setcancelDetails([data]); // Expecting `data` to be a list of flight objects
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Cancel Booking</h1>

      {/* Conditionally render the form or booking details */}
      {!cancelDetails.length ? (
        <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-md">
          <label htmlFor="bookingReference" className="block text-sm font-medium text-gray-700">
            Booking Reference
          </label>
          <input
            id="bookingReference"
            type="text"
            value={bookingReference}
            onChange={(e) => setBookingReference(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          <button
            onClick={handleCancel}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            View
          </button>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
      ) : (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-lg font-bold mb-4">Cancellation Details</h2>
          {cancelDetails.map((detail, index) => (
            <div key={index} className="p-4 mb-4 bg-white rounded-lg shadow-md">
                <h3 className="text-lg font-bold">Cancellation Summary</h3>
                <p><strong>Name:</strong> {detail.firstName} {detail.lastName}</p>
                <p><strong>Passport Number:</strong> {detail.passportNumber}</p>
                <p><strong>Ticket Number:</strong> {detail.ticketNumber}</p>
                <p><strong>Booking Reference:</strong> {detail.bookingReference}</p>
                <p><strong>Status:</strong> {detail.status}</p>
                
            </div>
          ))}
          <button
            onClick={() => setcancelDetails([])} // Reset to show the form again
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Back
          </button>
        </div>
      )}
    </div>
  );
};

export default CancelBookingPage;