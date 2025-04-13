/**
* This code was generated with the help of ChatGPT/GenAI and it was modified a bit to meet
* the speciifc requirement and standards.
*/

//src/app/(main)/layout.tsx
"use client";

import React from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider, useAuth } from "@/contexts/AuthContext"; // Ensure AuthProvider is implemented
import { ChildrenProps } from "@/types"; 

export default function MainLayout({ children }: ChildrenProps) {
  return (
    <AuthProvider> {/* ✅ Wrap everything inside the provider */}
      <LayoutContent>{children}</LayoutContent>
    </AuthProvider>
  );
}

function LayoutContent({ children }: ChildrenProps) {
  const { user } = useAuth(); // ✅ Now it's inside the AuthProvider

  return (
    <>
      <Navbar key={user ? "loggedIn" : "loggedOut"} />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </>
  );
}
