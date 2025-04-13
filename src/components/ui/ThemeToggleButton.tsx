// src/components/ui/ThemeToggleButton.tsx
"use client";

import React from 'react';
import { useTheme } from '@/hooks/useTheme'; // Import the hook
import { Button } from './Button'; // Use your Button component
// Optional: Icons
// import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();

  // Prevent rendering/hydration errors if theme isn't loaded yet
  // (Though ThemeProvider logic should prevent children rendering before theme is set)
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => { setIsMounted(true) }, []);

  if (!isMounted) {
    // Render a placeholder or null during server render/initial mount
     return <Button variant="outline" size="sm" className="h-9 w-[100px] animate-pulse bg-gray-200 dark:bg-gray-700" disabled />; // Placeholder size
  }

  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="sm" // Or 'icon' if just using icons
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      className="relative overflow-hidden px-3 h-9" // Example styling
    >
      {/* Example with rotating icons */}
      <span className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-in-out ${theme === 'dark' ? 'rotate-0 scale-100' : '-rotate-90 scale-0'}`}>
          ☀️ {/* <SunIcon className="h-5 w-5" /> */}
      </span>
      <span className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-in-out ${theme === 'light' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`}>
         🌙 {/* <MoonIcon className="h-5 w-5" /> */}
      </span>

       {/* Simple Text Fallback */}
       {/* {theme === 'light' ? 'Dark' : 'Light'} Mode */}
    </Button>
  );
};

export default ThemeToggleButton;