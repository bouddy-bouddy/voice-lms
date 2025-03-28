"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { useState, useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // Use client-side rendering to avoid hydration issues
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {isMounted ? (
          children
        ) : (
          <div style={{ visibility: "hidden" }}>{children}</div>
        )}
      </ThemeProvider>
    </SessionProvider>
  );
}
