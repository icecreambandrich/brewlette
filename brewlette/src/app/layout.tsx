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
  title: "Brewlette - Spin for Your Perfect Coffee ☕",
  description: "Discover amazing coffee shops in London with a fun spin! Find your next caffeine fix within walking distance.",
  keywords: "coffee, London, coffee shops, caffeine, discovery, local, spin, brewlette",
  authors: [{ name: "Brewlette" }],
  openGraph: {
    title: "Brewlette - Spin for Your Perfect Coffee ☕",
    description: "Discover amazing coffee shops in London with a fun spin! Find your next caffeine fix within walking distance.",
    type: "website",
    locale: "en_GB",
    siteName: "Brewlette",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brewlette - Spin for Your Perfect Coffee ☕",
    description: "Discover amazing coffee shops in London with a fun spin! Find your next caffeine fix within walking distance.",
  },
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
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
