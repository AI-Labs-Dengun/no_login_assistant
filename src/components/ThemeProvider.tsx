'use client' // Need this directive for hooks like useState, useEffect

import * as React from 'react'
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Ensure component only renders on the client where theme can be determined
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Render nothing or a loading state on the server
    // This prevents hydration mismatch errors
    return null;
  }

  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
} 