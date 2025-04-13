// src/components/layout/Navbar.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext'; // Use your specific path
import { useTheme } from '@/hooks/useTheme'; // Use your specific path
import { Button } from '@/components/ui/Button'; // Assuming Button component exists
import Image from 'next/image'; // Import next/image for profile picture
import { HTTPError } from '@/lib/api'; // Keep for potential fetch errors

const Navbar = () => {
  // Assume user is type: { id: number, firstName?: string, lastName?: string, email?: string, profilePicture?: string | null } | null
  const { user, isLoading: isAuthLoading, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for dropdown menu

  // --- Fetch notifications count ---
  useEffect(() => {
    let isMounted = true;
    let intervalId: NodeJS.Timeout | null = null;
  
    const fetchCount = async () => {
      if (!isMounted || !user?.id) {
        setNotificationsCount(0);
        return;
      }
  
      try {
        const res = await fetch(`/api/notifications/count?userId=${user.id}`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        if (isMounted) setNotificationsCount(data.count ?? 0);
      } catch (error) {
        console.error("Error fetching notification count:", error);
        if (isMounted) setNotificationsCount(0);
      }
    };
  
    if (!isAuthLoading && user) {
      fetchCount();
      intervalId = setInterval(fetchCount, 5000); // Poll every 5 seconds
    } else {
      setNotificationsCount(0);
    }
  
    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [user, isAuthLoading]);


  // --- Close dropdown on outside click ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close dropdown if click is outside the dropdown menu element
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    // Add listener only when dropdown is open
    if (dropdownOpen) {
        document.addEventListener("mousedown", handleClickOutside);
    }
    // Cleanup: remove listener when dropdown closes or component unmounts
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]); // Re-run effect when dropdownOpen state changes


  // --- Logout Handler ---
   const handleLogout = async () => {
       try {
           setDropdownOpen(false); // Close dropdown first
           await logout(); // Call context logout (handles storage clearing & redirect)
       } catch (error) {
            console.error("Logout failed", error);
       }
   };

  // --- Render Logic ---
  return (
    <nav className="bg-white dark:bg-gray-900 shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
          FlyNext
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex space-x-6 items-center">
           <Link href="/flights/search" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Flights</Link>
           {user && !isAuthLoading && (
                <Link href="/flights/cancel" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Cancel Flight
                </Link>
            )}
           {user && !isAuthLoading && (
                <Link href="/flights/verifybookings" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Verify Flight Booking
                </Link>
            )}
           <Link href="/hotels/search" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Hotels</Link>
           {/* Conditionally render Manage Hotels */}
           {user && !isAuthLoading && (
                <Link href="/manage-hotels" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Manage Hotels
                </Link>
            )}
        </div>

        {/* Right Side: Theme Toggle, Auth */}
        <div className="flex items-center space-x-4">
          {/* Theme Toggle Button */}
           <Button
            onClick={toggleTheme}
            variant="outline"
            size="sm"
            aria-label="Toggle theme"
            className="relative overflow-hidden px-3 h-9 w-9" // Make it square for icons
           >
             {/* Use absolute positioning for icons */}
             <span className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`}>☀️</span>
             <span className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ease-in-out ${theme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`}>🌙</span>
           </Button>

          {/* Auth Section */}
          <div className="flex items-center">
            {/* Auth Loading Placeholder */}
            {isAuthLoading ? (
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            ) : user ? (
              // --- User is Logged In: Dropdown ---
              // Assign ref to the outermost div of the dropdown mechanism
              <div className="relative" ref={dropdownRef}>
                {/* Dropdown Toggle Button */}
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900"
                  aria-haspopup="true"
                  aria-expanded={dropdownOpen}
                  aria-controls="user-dropdown-menu" // Link button to menu for accessibility
                >
                  {/* Profile Picture or Initials */}
                  <div className="relative w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      {user.profilePicture ? (
                        <Image
                            src={user.profilePicture} alt="User Profile" fill
                            style={{ objectFit: 'cover' }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            className="text-transparent"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                           {(user.firstName && user.lastName) ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase() : (user.email ? user.email[0].toUpperCase() : '?')}
                        </span>
                      )}
                  </div>
                  {/* Dropdown Arrow */}
                  <svg className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>

                {/* Dropdown Menu Content - Rendered conditionally */}
                {dropdownOpen && (
                  <div
                     id="user-dropdown-menu" // Match aria-controls
                     className="absolute right-0 mt-2 w-56 origin-top-right bg-white dark:bg-gray-800 shadow-lg rounded-md py-1 border border-gray-200 dark:border-gray-700 focus:outline-none z-50"
                     role="menu" // Accessibility roles
                     aria-orientation="vertical"
                     aria-labelledby="user-menu-button" // Assume button has id="user-menu-button" if needed
                  >
                     {/* User Info Header */}
                     <div className="px-4 py-3 border-b dark:border-gray-600">
                         <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={user.email || ''}>{user.firstName || ''} {user.lastName || ''}</p>
                         <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={user.email || ''}>{user.email || 'No Email'}</p>
                     </div>
                     {/* Menu Items */}
                     <div className="py-1" role="none"> {/* Accessibility role */}
                        <Link href="/profile" role="menuitem" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setDropdownOpen(false)}>Edit Profile</Link>
                        <Link href="/manage-hotels" role="menuitem" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setDropdownOpen(false)}>Manage Hotels</Link>
                        <Link href="/bookings" role="menuitem" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setDropdownOpen(false)}>My Bookings</Link>
                        {/* Notifications Link/Item */}
                        <Link href="/notifications" role="menuitem" className="flex justify-between items-center w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => setDropdownOpen(false)}>
                           <span>Notifications</span>
                           {notificationsCount >= 0 && (
                               <span className="ml-2 bg-red-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                               {notificationsCount}
                               </span>
                           )}
                        </Link>
                     </div>
                     <hr className="border-gray-200 dark:border-gray-600" />
                     {/* Logout Button */}
                     <div className="py-1" role="none">
                        <button onClick={handleLogout} role="menuitem" className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-red-400"> Logout </button>
                     </div>
                  </div>
                )}
              </div>
              // --- End User Logged In ---
            ) : (
              // --- User is Logged Out ---
              <div className="flex items-center space-x-2">
                 <Link href="/login"><Button variant="outline" size="sm">Login</Button></Link>
                 <Link href="/signup"><Button size="sm">Sign Up</Button></Link>
              </div>
              // --- End User Logged Out ---
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;