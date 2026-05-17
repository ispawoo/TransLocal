import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { PWAProvider } from "@/components/pwa-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TransLocal - Instant Offline-First Local File Sharing",
  description: "Share folders, files, links, and clipboard images between devices (Mobile ↔ Laptop) on the same local network (WiFi/LAN) with absolute zero cloud uploads. Zero auth required.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TransLocal",
  },
  applicationName: "TransLocal",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0F19",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full antialiased" style={{ colorScheme: "dark" }}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} bg-[#0B0F19] text-[#F8FAFC] min-h-full flex flex-col font-sans selection:bg-[#4F8CFF]/30 selection:text-[#4F8CFF]`}>
        <PWAProvider>
          {children}
        </PWAProvider>
      </body>
    </html>
  );
}

