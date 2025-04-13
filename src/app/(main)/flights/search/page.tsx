//AI assistance
"use client";
import React, { useState } from 'react';
import { useAuth} from '@/contexts/AuthContext';

const FlightSearchPage: React.FC = () => {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [dates, setDates] = useState('');
  const [returnDate, setReturnDate] = useState(''); // State for return date
  const [results, setResults] = useState<null | { outgoingFlights: Array<any>; returnFlights: Array<any> }>(null);
  const [error, setError] = useState('');
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [flightDetails, setFlightDetails] = useState<Array<any>>([]);
  const [showBookingForm, setShowBookingForm] = useState(false); // State to toggle booking form
  const [passportNumber, setPassportNumber] = useState(''); // State for passport number
  const [successMessage, setSuccessMessage] = useState(''); // State for success message
  const { user, refreshAccessToken, isTokenExpired } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResults(null);
    setSearchCompleted(false);
    setFlightDetails([]);

    try {
      // Fetch outgoing flights
      const outgoingQueryParams = new URLSearchParams({
        source,
        destination,
        dates,
      });

      const outgoingResponse = await fetch(`/api/flights/search?${outgoingQueryParams.toString()}`);
      if (!outgoingResponse.ok) {
        throw new Error('Failed to fetch outgoing flight data');
      }
      const outgoingFlights = await outgoingResponse.json();

      let returnFlights = [];
      if (returnDate) {
        // Fetch return flights
        const returnQueryParams = new URLSearchParams({
          source: destination,
          destination: source,
          dates: returnDate,
        });

        const returnResponse = await fetch(`/api/flights/search?${returnQueryParams.toString()}`);
        if (!returnResponse.ok) {
          throw new Error('Failed to fetch return flight data');
        }
        returnFlights = await returnResponse.json();
      }

      // Combine outgoing and return flights
      setResults({ outgoingFlights, returnFlights });
      setSearchCompleted(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  const handleViewDetails = async (flightIds: Array<string>) => {
    try {
      const details = await Promise.all(
        flightIds.map(async (id) => {
          const response = await fetch(`/api/flights/${id}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch details for flight ID: ${id}`);
          }
          return await response.json();
        })
      );
      setFlightDetails(details);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred while fetching flight details');
    }
  };

  const handleBook = () => {
    setShowBookingForm(true); // Show the booking form
  };

  const handleSelect = async () => {
    if (!passportNumber) {
      setError('Passport number is required.');
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
      const flightIds = flightDetails.map((detail) => detail.flightId); // Extract flight IDs
      const response = await fetch('/api/flights/booking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          passportNumber,
          flightIds,
        }),
      });
      console.log(flightIds);
  
      if (!response.ok) {
        throw new Error('Failed to book flights. Please try again.');
      }
      const data = await response.json();
      console.log("Booking response:", data);
      setSuccessMessage(`Booking successful! Your booking reference is: ${data.bookingReference}`);
      setFlightDetails([]); // Clear flight details
      setShowBookingForm(false); // Hide the booking form

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 px-4">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Flight Search</h1>

      {/* When the search has not been completed */}
      {!searchCompleted && (
        <form onSubmit={handleSearch} className="bg-white shadow-md rounded-lg p-6 w-full max-w-md space-y-4">
          <div>
            <label htmlFor="Source" className="block text-sm font-medium text-gray-700">Source</label>
            <input
              id="Source"
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700">Destination</label>
            <input
              id="destination"
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="dates" className="block text-sm font-medium text-gray-700">Dates</label>
            <input
              id="dates"
              type="date"
              value={dates}
              onChange={(e) => setDates(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="returnDate" className="block text-sm font-medium text-gray-700">Return Date</label>
            <input
              id="returnDate"
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Search Flights
          </button>
        </form>
      )}

      {/* When search has been completed */}
      {(searchCompleted && flightDetails.length === 0 && successMessage == '') && (
        <>
          {results && (results.outgoingFlights.length > 0 || results.returnFlights.length > 0) ? (
            <div className="mt-8 bg-white shadow-md rounded-lg p-6 w-full max-w-2xl">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Search Results</h2>
          
              {/* Outgoing Flights */}
              <h3 className="text-lg font-bold text-gray-800 mb-2">Outgoing Flights</h3>
              {results.outgoingFlights.map((flight) => (
                <div key={flight.id} className="p-4 mb-4 bg-gray-50 rounded-lg shadow-md">
                  <div className="flex justify-between items-center">
                    <div>
                      {flight.airlines.map((airline: string, index: number) => (
                        <div key={index}>
                          <strong>{airline}</strong>
                          <div>{flight.route_summary[index]}</div>
                        </div>
                      ))}
                      <div>
                        <strong>{flight.currency} {flight.totalPrice}</strong>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewDetails(flight.flightIds)}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
          
              {/* Return Flights */}
              {returnDate && results.returnFlights.length > 0 && (
                <>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">Return Flights</h3>
                  {results.returnFlights.map((flight) => (
                    <div key={flight.id} className="p-4 mb-4 bg-gray-50 rounded-lg shadow-md">
                      <div className="flex justify-between items-center">
                        <div>
                          {flight.airlines.map((airline: string, index: number) => (
                            <div key={index}>
                              <strong>{airline}</strong>
                              <div>{flight.route_summary[index]}</div>
                            </div>
                          ))}
                          <div>
                            <strong>{flight.currency} {flight.totalPrice}</strong>
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewDetails(flight.flightIds)}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
              <p>Click on the details button to see the full flight log and book!</p>
            </div>
          ) : (
            <p>No flights found.</p>
          )}

          {/* Error message */}
          {error && <p className="text-red-500 mt-4">{error}</p>}

          {/* Back to search button */}
          <button
            onClick={() => setSearchCompleted(false)}
            className="mt-6 text-indigo-600 hover:underline"
          >
            🔙 Back to Search
          </button>
        </>
      )}
      {/* Booking Form */}
      {showBookingForm && (
        <div className="mt-8 bg-white shadow-md rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Enter Passport Number</h2>
          <div>
            <label htmlFor="passportNumber" className="block text-sm font-medium text-gray-700">Passport Number</label>
            <input
              id="passportNumber"
              type="text"
              value={passportNumber}
              onChange={(e) => setPassportNumber(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          <button
            onClick={handleSelect}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Select
          </button>
          {error && <p className="text-red-500 mt-4">{error}</p>}
          {successMessage && <p className="text-green-500 mt-4">{successMessage}</p>}
        </div>
      )}
      {/* Display flight details */}
      {flightDetails.length > 0 && (
        <div className="mt-8 bg-white shadow-md rounded-lg p-6 w-full max-w-2xl">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Flight Details</h2>
          <button
            onClick={handleBook}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Book
          </button>
          {flightDetails.map((detail, index) => (
            <div key={index} className="p-4 mb-4 bg-gray-50 rounded-lg shadow-md">
              <h3 className="text-lg font-bold">Leg {index + 1}</h3>
              <p><strong>Airline:</strong> {detail.airlineName}</p>
              <p><strong>Airports:</strong> {detail.Airports}</p>
              <p><strong>Flight Number:</strong> {detail.flightNumber}</p>
              <p><strong>Available Seats:</strong> {detail.availableSeats}</p>
              <p><strong>Duration (hours):</strong> {detail.durationInHours}</p>
              <p><strong>Status:</strong> {detail.status}</p>
            </div>
          ))}
            <button
            onClick={() => {
              setFlightDetails([]);
              setShowBookingForm(false);
            }}
            className="mt-6 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
            🔙 Return to Searches
            </button>
        </div>
      )}

      
      {/* Booking Confirmation */}
      {successMessage && flightDetails.length === 0 && !showBookingForm && (
        <div className="mt-8 bg-white shadow-md rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Booking Confirmation</h2>
          <p className="text-green-500">{successMessage}</p>
          <button
            onClick={() => {
              setSuccessMessage('');
               // Return to search
            }}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Back to Search
          </button>
        </div>
      )}
    </div>
  );
};

export default FlightSearchPage;

