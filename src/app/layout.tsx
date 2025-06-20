import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "./providers/ThemeProvider";
import { headers } from "next/headers";
import { LanguageProvider } from '../lib/LanguageContext';
import { Toaster } from 'react-hot-toast';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const allHeaders = await headers();
  const theme = allHeaders.get("x-theme");
  
  return (
    <html suppressHydrationWarning className={`${inter.variable} ${theme === "dark" ? "dark" : ""}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var theme = localStorage.getItem('theme');
    var lang = localStorage.getItem('language') || navigator.language.split('-')[0];
    document.documentElement.lang = lang;
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch(e) {}
})();
            `,
          }}
        />
        <style dangerouslySetInnerHTML={{ __html: `
          html.dark {
            color-scheme: dark;
          }
          body {
            font-family: var(--font-inter), system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          }
        `}} />
      </head>
      <body className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text">
        <LanguageProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
