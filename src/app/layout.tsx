// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // Your global styles WITH Tailwind directives
import { ThemeProvider } from '@/contexts/ThemeContext'; // Import ThemeProvider

const inter = Inter({ subsets: ['latin'] });

// Define default metadata for your site
export const metadata: Metadata = {
  title: 'FlyNext - Travel Companion',
  description: 'Search and book flights and hotels easily with FlyNext.',
};

// This is the Root Layout component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The <html> tag is defined here
    <html lang="en" suppressHydrationWarning> {/* suppressHydrationWarning helps theme persistence */}
      {/* The <body> tag is defined here */}
      {/* Apply base font and ensure flex column for footer sticking */}
      <body className={`${inter.className} flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100`}>
        {/* ThemeProvider wraps EVERYTHING inside the body */}
        <ThemeProvider>
            {/* children here will be the content from matching layouts/pages */}
            {/* e.g., For '/login', children = <AuthLayout><LoginPage /></AuthLayout> */}
            {/* e.g., For '/', children = <MainLayout><LandingPage /></MainLayout> */}
            {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
