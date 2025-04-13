// src/components/providers/ThemeProvider.tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
// Remove the problematic import line:
// import type { ThemeProviderProps } from "next-themes/dist/types";

// Use React.ComponentProps to infer the props type from the provider itself
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}> {/* Pass all props down */}
      {children}
    </NextThemesProvider>
  );
}