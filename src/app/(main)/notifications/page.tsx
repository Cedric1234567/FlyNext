/**
* This code was generated with the help of ChatGPT/GenAI and it was modified a bit to meet
* the speciifc requirement and standards. The prompt given was the notifications user story
* from the assignment.
*/

// src/app/(main)/notifications/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext"; // Still needed to get user ID
import { useRequireAuth } from "@/hooks/useRequireAuth"; // Use auth guard
import { Notification as NotificationType } from "@/types"; // Use your specific Notification type
import { Button } from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { HTTPError } from "@/lib/api"; // Keep for typing fetch errors

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true); // Separate loading state
  const [error, setError] = useState<string | null>(null);
  // Use auth guard - isLoading indicates initial auth check
  const { user, isLoading: isAuthLoading } = useRequireAuth();

  // Fetch notifications when authentication is confirmed
  useEffect(() => {
    // Only fetch if auth check is done and user exists and has an ID
    if (!isAuthLoading && user && user.id) {
      console.log(`NotificationsPage: Fetching notifications for userId=${user.id}...`);
      setIsLoadingNotifications(true);
      setError(null);

      // *** Use direct fetch with userId query param ***
      fetch(`/api/notifications?userId=${user.id}`)
        .then(res => {
            if (!res.ok) {
                 return res.json().then(errData => {
                     // Create a compatible error structure
                     const error = new Error(`Failed to fetch notifications: ${res.statusText}`);
                     (error as any).status = res.status;
                     (error as any).info = errData;
                     throw error;
                 });
            }
            return res.json();
        })
        .then((data) => {
           console.log("NotificationsPage: Fetched notifications data:", data);
           // Expecting { notification: [] } from backend route
           setNotifications(Array.isArray(data?.notification) ? data.notification : []);
        })
        .catch((err) => {
          console.error("Error fetching notifications:", err);
           // Avoid showing generic auth errors if redirect handles them
           if (err?.status !== 401) {
               setError(err.info?.error || err.message || "Failed to load notifications.");
           }
           setNotifications([]); // Clear on error
        })
        .finally(() => {
          setIsLoadingNotifications(false);
        });
    } else if (!isAuthLoading && !user) {
        // Auth check done, no user, redirect is happening
        setIsLoadingNotifications(false);
        setNotifications([]);
        setError(null);
    } else {
         // Auth is loading
         setIsLoadingNotifications(false); // Not fetching yet
    }
  }, [user, isAuthLoading]); // Depend on auth state

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: number) => {
    const originalNotifications = notifications;
    setNotifications((prev) => prev.filter((notif) => notif.id !== notificationId));

    try {
      console.log(`NotificationsPage: Marking notification ${notificationId} as read...`);
      // *** Use direct fetch with notificationId query param ***
      const res = await fetch(`/api/notifications?notificationId=${notificationId}`, {
        method: "PATCH",
      });

      if (!res.ok) {
          setNotifications(originalNotifications); // Revert optimistic update
          const errorData = await res.json().catch(() => ({}));
          const error = new Error(`Failed to mark as read: ${res.statusText}`);
            (error as any).status = res.status;
            (error as any).info = errorData;
          throw error;
      }
      console.log(`NotificationsPage: Marked notification ${notificationId} successfully.`);
      // If optimistic update worked, no further action needed here
    } catch (error: any) {
      console.error("Failed to mark notification as read:", error);
      // Error already logged, UI reverted, maybe show a toast message
       // setError("Failed to update notification status."); // Optionally set page error
    }
  };


  // --- Render Logic ---

  if (isAuthLoading) {
     return <div className="flex justify-center items-center min-h-[200px]"><Spinner /><p className="ml-3">Loading...</p></div>;
  }
  if (!user) {
     return <div className="text-center p-4">Loading session or redirecting...</div>;
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Notifications</h1>

      {isLoadingNotifications ? (
        <div className="flex justify-center items-center py-10">
            <Spinner /> <p className="ml-3 text-gray-600 dark:text-gray-400">Loading notifications...</p>
        </div>
      ) : error ? (
         <div className="text-center py-10 px-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-lg">
             <p className="font-semibold text-red-700 dark:text-red-300">Error</p>
             <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
         </div>
       ) : notifications.length === 0 ? (
        <div className="text-center py-10 px-4 bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
             <p className="text-gray-600 dark:text-gray-400">You have no unread notifications.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notif) => (
            <li key={notif.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700">
              <span className="text-sm text-gray-800 dark:text-gray-200">{notif.message}</span>
              <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(notif.id)}>
                Mark as Read
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}