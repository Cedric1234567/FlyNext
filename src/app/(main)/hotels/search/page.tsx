/**
* This code was generated with the help of ChatGPT/GenAI and it was modified a bit to meet
* the speciifc requirement and standards. The prompt given was the hotels user story
* from the assignment.
*/

// src/app/hotels/search/page.tsx
"use client"; // Necessary for useState, useEffect (if added later), event handlers

import React, { useState } from "react";
import HotelSearchForm from "@/components/hotels/HotelSearchForm"; // Adjust path if needed
import HotelList from "@/components/hotels/HotelList";       // Adjust path if needed
import type { HotelSearchResult } from "@/types"; // Import the HotelSearchResult type from your types directory

// Define the structure of the form data to match HotelSearchParams from HotelSearchForm
interface HotelSearchFormData {
  city?: string;
  checkInDate?: string;
  checkOutDate?: string;
  name?: string;
  starRating?: number | null;
  minPrice?: number;   // Changed from string to number
  maxPrice?: number;   // Changed from string to number
  selectedAmenities?: string; // Changed from string[] to string to match HotelSearchParams
}

export default function HotelSearchPage() {
  // State for search results, loading status, and potential errors
  const [hotels, setHotels] = useState<HotelSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  // State to track if a search has been performed at least once
  const [hasSearched, setHasSearched] = useState(false);

  // Handler function for the form submission
  const handleHotelSearch = async (formData: HotelSearchFormData) => {
    console.log("Searching hotels with:", formData);
    setIsLoading(true);
    setSearchError(null);
    setHotels([]); // Clear previous results immediately
    setHasSearched(true); // Mark that a search has been attempted

    // Construct query parameters, only adding non-empty values
    const params = new URLSearchParams();
    if (formData.city) params.append("city", formData.city);
    if (formData.checkInDate) params.append("checkInDate", formData.checkInDate);
    if (formData.checkOutDate) params.append("checkOutDate", formData.checkOutDate);
    if (formData.name) params.append("name", formData.name);
    if (formData.starRating) params.append("starRating", formData.starRating.toString());
    if (formData.minPrice) params.append("minPrice", formData.minPrice.toString());
    if (formData.maxPrice) params.append("maxPrice", formData.maxPrice.toString());
    if (formData.selectedAmenities) {
      params.append("amenities", formData.selectedAmenities);
    }
    // Add any other fields you need from the form

    try {
      // Construct the full API URL using environment variable for base path
      // Fallback to /api if the env variable isn't set
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
      const apiUrl = `${apiBaseUrl}/hotels/index?${params.toString()}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          // Try to parse specific error message from backend
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError);
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      // Ensure data.hotels is an array before setting state
      setHotels(Array.isArray(data.hotels) ? data.hotels : []);
    } catch (error: any) {
      console.error("Failed to fetch hotels:", error);
      setSearchError(
        error.message || "An unexpected error occurred. Please try again."
      );
      setHotels([]); // Ensure hotels are cleared on error
    } finally {
      setIsLoading(false); // Ensure loading is turned off regardless of success/failure
    }
  };

  return (
    
    <div className="container mx-auto px-4 py-8">


      <section className="bg-white dark:bg-gray-800/60 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700/50 mb-12">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">
          Find Your Perfect Hotel Stay
        </h1>
        {/* Use onSearchSubmit as specified by your interface */}
        <HotelSearchForm onSearchSubmit={handleHotelSearch} isLoading={isLoading} />
      </section>

      <section className="mt-8 min-h-[300px]">
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-10">
            <svg
              className="animate-spin h-8 w-8 text-blue-600 dark:text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="ml-3 text-gray-600 dark:text-gray-400">
              Searching for hotels...
            </p>
          </div>
        )}

        {/* Error State */}
        {!isLoading && searchError && (
          <div className="text-center py-10 px-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg">
            <p className="font-semibold text-red-700 dark:text-red-300">
              Search Error
            </p>
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {searchError}
            </p>
          </div>
        )}

        {/* Success State (with results or no results message) */}
        {!isLoading && !searchError && hasSearched && <HotelList hotels={hotels} />}

        {/* Initial State (before any search) */}
        {!isLoading && !searchError && !hasSearched && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            <p>Enter your destination and dates to find hotels.</p>
          </div>
        )}
      </section>
    </div>
  );
}
