// src/contexts/AuthContext.tsx
"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react"; // Added useCallback
import { useRouter } from "next/navigation";
import { jwtDecode } from "jwt-decode";
import { User } from "@/types"; // Use your specific User type

// 1. Define the context type WITH isLoading
export interface AuthContextType {
    user: User | null;
    setUser: React.Dispatch<React.SetStateAction<User | null>>;
    login: (token: string, refreshToken: string) => Promise<void>; // Made async for fetchUser call
    logout: () => void;
    isLoading: boolean; // <-- ADDED
    isTokenExpired: (token: string) => boolean;  // <-- Add this
    refreshAccessToken: () => Promise<void>; 
}

// Create context with undefined default to allow check in useAuth
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    // 2. Add isLoading state, initialize to true
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const router = useRouter(); // Use router for potential navigation in future

    // --- Token Validation & User Fetching ---

    const isTokenExpired = useCallback((token: string): boolean => {
        try {
            const decoded: any = jwtDecode(token);
            return decoded.exp * 1000 < Date.now();
        } catch (error) {
            console.error("Token decode error:", error);
            return true; // Treat as expired if invalid
        }
    }, []); // No dependencies, pure function

    const logout = useCallback(() => {
        console.log("AuthContext: Logging out...");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
        setIsLoading(false); // Definitive state: Not loading, no user
        // Redirect should ideally be handled by the component calling logout,
        // but forceful redirect might be needed if token expires mid-session.
        // Consider router.push('/login') first if possible.
        window.location.href = '/login'; // Keep for now if necessary
    }, [router]); // Include router if you use router.push

    const fetchUser = useCallback(async (token: string) => {
        console.log("AuthContext: Fetching user data...");
        setIsLoading(true); // Set loading true when fetch starts
        try {
            // Use POST /api/auth/user as defined in your route
            const res = await fetch("/api/auth/user", {
                method: "POST", // Changed back to POST based on your route file
                headers: {
                    // Token MUST be sent in header for backend verifyToken
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                 // Body might be redundant if backend reads header, but matching your route for now
                body: JSON.stringify({ token: token })
            });

            console.log("AuthContext FetchUser Response Status:", res.status);

            if (res.ok) {
                const userData = await res.json();
                 // Assuming API returns { user: UserData } based on your route
                console.log("AuthContext FetchUser Success, User Data:", userData.user || userData);
                setUser(userData.user || null); // Extract nested user if needed, ensure null if not found
            } else {
                console.error("AuthContext FetchUser failed, status:", res.status);
                // Token might be invalid even if not expired (e.g., revoked, user deleted)
                logout(); // Logout if user fetch fails
                // Optionally attempt refresh if status suggests expired token (e.g., 401)
                // if (res.status === 401) { refreshAccessToken(); } else { logout(); }
            }
        } catch (error) {
            console.error("AuthContext: Network error fetching user data:", error);
            logout(); // Logout on network errors
        } finally {
            console.log("AuthContext: FetchUser finished, setting isLoading=false");
            setIsLoading(false); // Loading finished regardless of outcome
        }
    }, [logout]); // Include logout in dependencies

    const refreshAccessToken = useCallback(async () => {
        const refreshToken = localStorage.getItem("refreshToken");
        console.log("AuthContext: Attempting token refresh...");
        if (!refreshToken) {
            console.log("AuthContext Refresh: No refresh token found.");
            // Don't call logout() here directly, let the effect handle it based on final state
            setIsLoading(false); // No tokens, so loading is done
            return;
        }

        try {
            const res = await fetch("/api/auth/refresh", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                // Send refresh token in body as per login route pattern
                 body: JSON.stringify({ refreshToken }),
                // Alternatively, send in header if refresh route expects it there
                 // headers: { Authorization: `Bearer ${refreshToken}`, "Content-Type": "application/json" },
            });

            if (res.ok) {
                const data = await res.json();
                console.log("AuthContext Refresh: Success, got new access token.");
                localStorage.setItem("accessToken", data.accessToken);
                await fetchUser(data.accessToken); // Fetch user with the new token (sets loading false)
            } else {
                console.error("AuthContext Refresh: Failed, status:", res.status);
                logout(); // Refresh failed, log out completely (sets loading false)
            }
        } catch (error) {
            console.error("AuthContext Refresh: Network error during refresh:", error);
            logout(); // Logout on network error (sets loading false)
        }
    }, [fetchUser, logout]); // Dependencies for refresh

    // --- Initial Load Effect ---
    useEffect(() => {
        console.log("AuthContext: Initial mount check.");
        setIsLoading(true); // Start in loading state
        const accessToken = localStorage.getItem("accessToken");
        if (accessToken) {
            if (isTokenExpired(accessToken)) {
                console.log("AuthContext Initial: Token expired, refreshing...");
                refreshAccessToken(); // Will eventually call fetchUser or logout, setting loading false
            } else {
                console.log("AuthContext Initial: Token valid, fetching user...");
                fetchUser(accessToken); // Will set loading false when done
            }
        } else {
             console.log("AuthContext Initial: No token found.");
             setUser(null);
             setIsLoading(false); // No token, not loading
        }
    }, [fetchUser, isTokenExpired, refreshAccessToken]); // Include all function dependencies

    // --- Context API Functions ---
    const login = useCallback(async (token: string, refreshToken: string) => {
        console.log("AuthContext: login function called.");
        localStorage.setItem("accessToken", token);
        localStorage.setItem("refreshToken", refreshToken);
        await fetchUser(token); // Fetch user to update state immediately (sets loading)
        // Redirect is now handled by the component calling login
    }, [fetchUser]); // Dependency on fetchUser

    // `logout` is already defined using useCallback above

    // 3. Provide isLoading in the context value
    const contextValue = { user, login, logout, isLoading, setUser, isTokenExpired, refreshAccessToken };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// useAuth hook remains unchanged, but benefits from added isLoading in context type
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};