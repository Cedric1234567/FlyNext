// src/components/layout/Footer.tsx
import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-gray-900 mt-auto py-6">
      <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400 text-sm">
        © {new Date().getFullYear()} FlyNext. Your reliable travel companion. All rights reserved.
        {/* Add other footer links or info if needed */}
      </div>
    </footer>
  );
};

export default Footer;