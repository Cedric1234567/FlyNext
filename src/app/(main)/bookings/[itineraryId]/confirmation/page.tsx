/**
* This code was generated with the help of ChatGPT and it was modified a bit to meet
* the speciifc requirement and standards. The prompt given was the bookings user story
* from the assignment.
*/

'use client';

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function ConfirmationPage() {
  const router = useRouter();
  const params = useParams();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshAccessToken, isTokenExpired } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const itineraryid = Array.isArray(params.itineraryId) ? params.itineraryId[0] : params.itineraryId;

  useEffect(() => {
    setToken(localStorage.getItem('accessToken'));
    }, []);

  useEffect(() => {
    if (!itineraryid) return;
    console.log("Fetching confirmation PDF with ID:", itineraryid);

    const fetchConfirmationPdf = async() => {
        let token = localStorage.getItem('accessToken');

        if (!token) {
            console.log("No token found, redirecting to login...");
            setError("No access token found. Please log in again.");
            return;
        }
        if (isTokenExpired(token)) {
            await refreshAccessToken();
            setToken(localStorage.getItem('accessToken'));
        }
        console.log("Fetching confirmation PDF:");
      try {
        const response = await fetch(`/api/bookings/pdf?itineraryId=${itineraryid}`, {
          method: "GET",
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch confirmation PDF");
        }
        console.log("Response status:", response);

        const blob = await response.blob();
        const pdfUrl = URL.createObjectURL(blob);
        setPdfUrl(pdfUrl);
      } catch (err) {
        setError("Error loading confirmation PDF");
      } finally {
        setLoading(false);
      }
    }

    fetchConfirmationPdf();
  }, [itineraryid]);

  if (loading) return <p className="text-center text-lg">Loading confirmation...</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Booking Confirmation</h1>
      {pdfUrl ? (
        <iframe src={pdfUrl} className="w-full h-[500px] border rounded-lg shadow-lg" />
      ) : (
        <p>No confirmation document available.</p>
      )}
    </div>
  );
}
