// src/components/auth/LoginFormWrapper.tsx
"use client"; // This component uses client hooks

import React, { useState } from 'react';
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { loginUser, HTTPError } from '@/lib/api'; // <-- Import loginUser and HTTPError
// Import your Button/Input components if needed

export default function LoginFormWrapper() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth(); // Get context login function
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // *** USE API FUNCTION INSTEAD OF FETCH ***
            // The loginUser function takes the credentials object
            const responseData = await loginUser({ email, password });
            // loginUser (via apiCall) will throw HTTPError if response.ok is false

            // Assuming loginUser returns { accessToken, refreshToken, user? } on success
            const { accessToken, refreshToken } = responseData;

            // Validate that tokens were received (can add user check too if needed)
            if (!accessToken || !refreshToken) {
                 console.error("Login Success but tokens missing in response:", responseData);
                 throw new Error('Login succeeded but received invalid token data.');
            }

            // Call context login function (it handles storage and fetching user)
            await login(accessToken, refreshToken);
            console.log('Login successful, context updated.');

            // Redirect Logic (remains the same)
            const redirectPath = searchParams.get('redirect');
            const targetPath = redirectPath || '/';
            console.log(`Attempting to redirect to: ${targetPath}`);
            router.push(targetPath);

        } catch (error: any) {
            console.error("Login Page Error:", error);
            // Handle HTTPError specifically if possible
            if (error instanceof HTTPError) {
                 setError(error.info?.error || error.message || 'Login failed.');
            } else {
                 setError(error.message || 'An unexpected error occurred.');
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Return the actual form JSX (No changes needed here) ---
    return (
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border dark:border-gray-700">
            <h1 className="text-2xl font-semibold text-center mb-4 text-gray-900 dark:text-white">Login</h1>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">Please log in to continue</p>

            <form onSubmit={handleLogin} className="space-y-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input
                        id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                        placeholder="you@example.com"
                    />
                </div>
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                    <input
                        id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                </div>
                {error && <p className="text-red-500 dark:text-red-400 text-sm mb-4 text-center">{error}</p>}
                <button
                    type="submit" disabled={loading}
                    className={`w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-opacity ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {loading ? 'Logging in...' : 'Log In'}
                </button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <a href="/signup" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">
                    Sign up
                </a>
            </p>
        </div>
    );
}