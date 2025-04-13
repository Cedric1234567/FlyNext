/**
* This code was generated with the help of ChatGPT/GenAI and it was modified a bit to meet
* the speciifc requirement and standards. The prompt given was the accounts user story
* from the assignment.
*/

// src/app/(main)/profile/page.tsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext'; // Get REAL user data
import { useRequireAuth } from '@/hooks/useRequireAuth'; // Protect the page
import Spinner from '@/components/ui/Spinner'; // Assuming Spinner component exists
import { Button } from '@/components/ui/Button'; // Assuming Button component exists
import { InputField } from '@/components/ui/InputField'; // Assuming InputField exists
import { User } from '@/types'; // Use your User type
import { formatDateForAPI } from '@/lib/utils'; // Assuming this helper exists
import { HTTPError } from '@/lib/api'; // Import if needed for API call error handling

export default function ProfilePage() {
    // 1. Use auth guard and get user data/loading state from context
    const { user, isLoading: isAuthLoading } = useRequireAuth();
    const { setUser, isTokenExpired, refreshAccessToken } = useAuth(); // Assuming setUser is available in context

    // 2. State for form fields, potentially pre-filled from user context
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '', // Email usually not editable, display only
        phoneNumber: '',
        newPassword: '',
        confirmPassword: '',
        profilePicFile: null as File | null,
        // Initialize preview with null, set in useEffect
        profilePicPreview: null as string | null,
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // 3. Effect to pre-fill form when user data loads from context
    useEffect(() => {
        if (user) {
            console.log("ProfilePage: Pre-filling form with user data:", user);
            setFormData(prev => ({
                // Keep potentially edited fields if desired, or reset password fields always
                ...prev,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email || '',
                phoneNumber: user.phoneNumber || '',
                profilePicPreview: user.profilePicture || null, // Set initial preview from user context
                profilePicFile: null, // Ensure file is reset when user context changes
                newPassword: '', // Clear password fields on user load
                confirmPassword: '',
            }));
        }
    }, [user]); // Run when user object from context changes


    // 4. Form change handlers
    // *** FIX: Define a specific handler for InputField's expected signature ***
    const handleInputChange = (name: keyof typeof formData) => (value: string) => {
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // Clean up previous object URL before creating a new one
        if (formData.profilePicPreview && formData.profilePicPreview.startsWith('blob:')) {
             URL.revokeObjectURL(formData.profilePicPreview);
        }
        if (file) {
            setFormData(prev => ({
                 ...prev,
                 profilePicFile: file,
                 profilePicPreview: URL.createObjectURL(file) // Create local preview URL
                }));
        } else {
             // Handle case where user cancels file selection
             setFormData(prev => ({
                 ...prev,
                 profilePicFile: null,
                 // Revert preview to original from context
                 profilePicPreview: user?.profilePicture || null
             }));
        }
    };

    // Cleanup object URL when component unmounts or preview changes
    useEffect(() => {
        const currentPreview = formData.profilePicPreview;
        // Only revoke if it's a blob URL (created by createObjectURL)
        if (currentPreview && currentPreview.startsWith('blob:')) {
            return () => {
                console.log("Revoking Object URL:", currentPreview);
                URL.revokeObjectURL(currentPreview);
            };
        }
    }, [formData.profilePicPreview]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);
    
        if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setError("New passwords do not match.");
            return;
        }
    
        if (!user || !user.id) {
            setError("User session not found. Please log in again.");
            return;
        }
    
        setIsSaving(true);
    
        const dataToSend = new FormData();
    
        // Compare fields and add only if changed
        if (formData.firstName !== user.firstName) {
            dataToSend.append('firstName', formData.firstName);
        }
    
        if (formData.lastName !== user.lastName) {
            dataToSend.append('lastName', formData.lastName);
        }
    
        if (formData.phoneNumber !== user.phoneNumber) {
            dataToSend.append('phoneNumber', formData.phoneNumber);
        }
    
        // Only include password if it's being changed
        if (formData.newPassword) {
            dataToSend.append('password', formData.newPassword);
        }
    
        // Only include a new profile picture if a file was selected
        if (formData.profilePicFile) {
            dataToSend.append('profilePicture', formData.profilePicFile);
        }
    
        // If no changes, show a message
        if (Array.from(dataToSend.entries()).length === 0) {
            setError("No changes to save.");
            setIsSaving(false);
            return;
        }
    
        try {
            let token = localStorage.getItem('accessToken');
            if (!token) {
                setError("No access token found. Please log in again.");
                return;
            }
            if(isTokenExpired(token)) {
                await refreshAccessToken();
                token = localStorage.getItem('accessToken');
            }
            const response = await fetch(`/api/user/update?userId=${user.id}`, {
                method: "PATCH",
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: dataToSend,
            });
    
            const result = await response.json();
    
            if (!response.ok) {
                throw new Error(result.error || "Failed to update profile");
            }
    
            setSuccessMessage("Profile updated successfully!");
            setFormData(prev => ({ ...prev, newPassword: '', confirmPassword: '' }));
            setUser(result.user);
    
        } catch (err: any) {
            console.error("Error updating profile:", err);
            if (err instanceof HTTPError) {
                setError(err.info?.error || err.message || 'Failed to update profile.');
            } else {
                setError(err.message || 'An unexpected error occurred.');
            }
        } finally {
            setIsSaving(false);
        }
    };
    
    // --- Render Logic ---
    if (isAuthLoading) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
                <Spinner /> <p className="ml-2">Loading Profile...</p>
             </div>
        );
    }

    if (!user) {
        // Should be redirected by useRequireAuth, but show message just in case
        return <div className="p-4 text-center">Please log in to view your profile.</div>;
    }

    return (
       <div className="max-w-2xl mx-auto p-4 md:p-6">
         <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-900 dark:text-white">Edit Profile</h1>
         <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow border dark:border-gray-700">
             {/* Error and Success Message Placeholders */}
             {error && <div className="p-3 text-sm text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-md border border-red-300 dark:border-red-700/50">{error}</div>}
             {successMessage && <div className="p-3 text-sm text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-300 rounded-md border border-green-300 dark:border-green-700/50">{successMessage}</div>}

             {/* Profile Picture Section */}
             <div className="flex items-center space-x-4">
                 <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border dark:border-gray-600 flex-shrink-0">
                    {formData.profilePicPreview ? (
                        <Image
                            src={formData.profilePicPreview}
                            alt="Profile Preview"
                            fill
                            style={{ objectFit: 'cover' }}
                            // Prevent Next.js from trying to optimize blob URLs
                            unoptimized={formData.profilePicPreview.startsWith('blob:')}
                        />
                    ) : (
                        <span className="absolute inset-0 flex items-center justify-center text-gray-500 text-3xl">?</span>
                    )}
                 </div>
                 <div className='flex-grow'>
                     <label htmlFor="profilePicInput" className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Change Profile Picture</label>
                     <input
                         id="profilePicInput"
                         name="profilePictureInput" // Name attribute for the input itself
                         type="file"
                         accept="image/*" // Allow only image types
                         onChange={handleFileChange}
                         className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 dark:file:bg-gray-700 dark:file:text-gray-300 dark:hover:file:bg-gray-600 cursor-pointer"
                     />
                     <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Upload a new image (JPG, PNG, GIF).</p>
                 </div>
             </div>

             {/* Personal Information Fields */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <InputField label="First Name" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange('firstName')} required />
                 <InputField label="Last Name" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange('lastName')} required />
             </div>
             <div>
                <InputField label="Email" id="email" name="email" value={formData.email} onChange={handleInputChange('email')} required />
             </div>
             <InputField label="Phone Number" id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleInputChange('phoneNumber')} />

             <hr className="my-6 border-gray-300 dark:border-gray-600" />

             {/* Password Change Section */}
             <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Change Password (Optional)</h3>
             <InputField label="New Password" id="newPassword" name="newPassword" type="password" value={formData.newPassword} onChange={handleInputChange('newPassword')} placeholder="Leave blank to keep current password" />
             <InputField label="Confirm New Password" id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange('confirmPassword')} />

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
                 <Button type="submit" isLoading={isSaving} disabled={isSaving}>
                     Save Changes
                 </Button>
            </div>
        </form>
       </div>
    );
}