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
  title: {
    default: "SaaS Pulse | Real-Time Founder Dashboard",
    template: "%s | SaaS Pulse"
  },
  description: "The ultimate command center for SaaS founders. Track MRR, user activity, and business pulse in real-time.",
  openGraph: {
    title: "SaaS Pulse | Startup Intelligence",
    description: "Monitor your startup's heartbeat with zero-latency live data.",
    url: "https://saaspulse.com",
    siteName: "SaaS Pulse",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SaaS Pulse | Founder Mastery",
    description: "Track your SaaS growth from a single, high-performance dashboard.",
    creator: "@saaspulse",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

import { AuthProvider } from "@/context/Auth_Context";
import QueryProvider from "@/components/QueryProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
