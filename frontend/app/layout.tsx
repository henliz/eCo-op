import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "skrimp – Your groceries, but smarter. Start Skrimping today",
  description: "Skrimp uses AI to help Canadians save money on groceries during the cost of living crisis by creating meal plans based on this week's local deals and flyers. Start skrimping today.",
  icons: {
    icon: [
      {
        url: "/SmartCart_Black.png",
        type: "image/png",
        sizes: "any",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/SmartCart_White.png",
        type: "image/png",
        sizes: "any",
        media: "(prefers-color-scheme: light)",
      },
    ],
    // fallback for older browsers:
    shortcut: "/favicon-dark.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
