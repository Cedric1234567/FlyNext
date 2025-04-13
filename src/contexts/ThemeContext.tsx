// // src/contexts/ThemeContext.tsx
// 'use client'; // This context needs client-side features (localStorage, state)

// import React, { createContext, useState, useEffect, useCallback } from 'react';
// import { Theme, ThemeContextType, ChildrenProps } from '@/types';

// const defaultState: ThemeContextType = {
//   theme: 'light',
//   toggleTheme: () => {},
// };

// export const ThemeContext = createContext<ThemeContextType>(defaultState);

// export const ThemeProvider = ({ children }: ChildrenProps) => {
//   const [theme, setTheme] = useState<Theme>('light'); // Default theme

//   // Effect to load theme from localStorage and apply initial class
//   useEffect(() => {
//     const storedTheme = localStorage.getItem('theme') as Theme | null;
//     const initialTheme = storedTheme || 'light';
//     setTheme(initialTheme);
//     document.documentElement.classList.toggle('dark', initialTheme === 'dark');
//   }, []);

//   const toggleTheme = useCallback(() => {
//     setTheme((prevTheme) => {
//       const newTheme = prevTheme === 'light' ? 'dark' : 'light';
//       localStorage.setItem('theme', newTheme);
//       document.documentElement.classList.toggle('dark', newTheme === 'dark');
//       return newTheme;
//     });
//   }, []);

//   return (
//     <ThemeContext.Provider value={{ theme, toggleTheme }}>
//       {children}
//     </ThemeContext.Provider>
//   );
// };






// src/contexts/ThemeContext.tsx
'use client'; // Context needs client-side features

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Theme, ThemeContextType, ChildrenProps } from '@/types'; // Adjust import path if needed

// Default state (can be overridden by localStorage)
const defaultState: ThemeContextType = {
  theme: 'light', // Default to light
  toggleTheme: () => {},
};

export const ThemeContext = createContext<ThemeContextType>(defaultState);

export const ThemeProvider = ({ children }: ChildrenProps) => {
  // Initialize state - initially null to detect if value loaded from storage
  const [theme, setTheme] = useState<Theme | null>(null);

  // Effect 1: Load theme from localStorage on initial mount
  useEffect(() => {
    let storedTheme: Theme | null = null;
    try {
      storedTheme = localStorage.getItem('theme') as Theme | null;
    } catch (e) {
       console.warn("Could not access localStorage for theme.");
    }
    // Determine initial theme: stored value -> OS preference (optional) -> default 'light'
    // For simplicity, we'll just use stored or default light here.
    const initialTheme = storedTheme || 'light';
    console.log("ThemeProvider: Initial theme set to:", initialTheme);
    setTheme(initialTheme);

    // Clean up previous class just in case
    // document.documentElement.classList.remove('light', 'dark');
    // Add the correct class based on the initial theme
    // document.documentElement.classList.add(initialTheme);

  }, []); // Run only once on mount


   // Effect 2: Update HTML class and localStorage whenever theme state changes AFTER initial load
   useEffect(() => {
    if (theme !== null) { // Only run after initial theme is set
         console.log("ThemeProvider: Theme changed to:", theme, ". Updating class and localStorage.");
         const root = document.documentElement;
         // Remove the opposite theme class and add the current one
         if (theme === 'dark') {
             root.classList.remove('light');
             root.classList.add('dark');
         } else {
             root.classList.remove('dark');
             root.classList.add('light'); // Optional: explicitly add 'light' class
         }
         // Save preference to localStorage
         try {
            localStorage.setItem('theme', theme);
         } catch (e) {
             console.warn("Could not save theme to localStorage.");
         }
    }
   }, [theme]); // Run whenever theme state variable changes


  // Toggle function using useCallback
  const toggleTheme = useCallback(() => {
    setTheme((prevTheme) => {
      // If theme hasn't loaded yet, default toggle from 'light'
      const current = prevTheme ?? 'light';
      const newTheme = current === 'light' ? 'dark' : 'light';
      console.log("ThemeProvider: Toggling theme to:", newTheme);
      return newTheme;
    });
  }, []); // No dependencies needed

  // Prevent rendering children until theme is determined to avoid flash of wrong theme
  if (theme === null) {
     // You could return null or a simple loading state/spinner here
     // Returning null might cause layout shifts, returning children might cause FOUC
     // Often best to let it render but ensure initial class is set quickly
     // Or use a CSS variable approach for themeing if FOUC is bad
     return null; // Or return <>{children}</> if initial flash is acceptable
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};