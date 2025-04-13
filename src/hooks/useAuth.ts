// src/hooks/useAuth.ts
import { useContext } from 'react';
// Import the context itself AND the type definition for what it provides
// Ensure AuthContextType includes isLoading now
import { AuthContext, AuthContextType } from '@/contexts/AuthContext'; // Adjust path if needed

/**
 * Custom hook to easily consume the authentication context.
 * Provides access to user state, login, logout functions, and loading status.
 *
 * @returns The authentication context value.
 * @throws {Error} If used outside of an AuthProvider.
 */
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};