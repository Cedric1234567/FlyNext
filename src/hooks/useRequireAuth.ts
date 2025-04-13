// src/hooks/useRequireAuth.ts
"use client"; // Hook used in client components

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext'; // Uses the updated useAuth
import { User } from '@/types'; // Import User type

// Define the return type
interface UseRequireAuthReturn {
    user: User | null;
    isLoading: boolean; // Directly reflects AuthContext's loading state
}

/**
 * Custom hook to enforce authentication on a page or component.
 * Redirects unauthenticated users to the login page.
 * Relies on AuthContext's isLoading state.
 */
export function useRequireAuth(): UseRequireAuthReturn {
    // Destructure user and isLoading directly from the updated AuthContext
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        console.log(`useRequireAuth Effect: Auth Loading=${isLoading}, User=${user ? 'Exists' : 'Null'}`);

        // Only perform check and redirect *after* AuthContext has finished loading
        if (!isLoading) {
            if (!user) {
                // If no user is found after loading, redirect to login
                console.log(`useRequireAuth: No user found. Redirecting to login from path: ${pathname}`);
                const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
                router.replace(loginUrl); // Use replace for better history management
            } else {
                 console.log("useRequireAuth: User authenticated.");
                 // User exists, do nothing, allow component to render
            }
        }
    }, [user, isLoading, router, pathname]); // Effect runs when auth state potentially changes

    console.log(`useRequireAuth Return: isLoading=${isLoading}, User=${user ? 'Exists' : 'Null'}`);

    // Return the user object and the loading state directly from context
    return { user, isLoading };
}