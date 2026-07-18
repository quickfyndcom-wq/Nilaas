import { Outfit } from "next/font/google";
import "./globals.css";
import React from "react";
import MetaPixel from "@/components/MetaPixel";
import ClientLayout from "./ClientLayout";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://nilaas.in"),
  title: "Nilaas Jewellery – Where Elegance Meets Craftsmanship",
  description:
    "Nilaas Jewellery offers beautifully crafted designs made to shine forever. Find luxury jewellery pieces perfect for weddings, gifts, and everyday elegance.",
  icons: {
    icon: { url: "/favicon.png", type: "image/png" },
    shortcut: "/favicon.png",
    apple: "/apple-icon.png",
  },
};
// Performance optimization
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }) {
  const s3Base = process.env.NEXT_PUBLIC_S3_BASE_URL || process.env.AWS_S3_PUBLIC_URL;
  let s3Origin = null;
  try {
    if (s3Base) s3Origin = new URL(s3Base).origin;
  } catch {}

  return (
    <html lang="en">
      <head>
        {s3Origin && (
          <>
            <link rel="dns-prefetch" href={s3Origin} />
            <link rel="preconnect" href={s3Origin} crossOrigin="anonymous" />
          </>
        )}
        {/* Preload APIs to kick off fetch sooner */}
        <link rel="preload" href="/api/store/hero-banners" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/api/categories" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/api/store/settings" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/api/store/collections" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/api/store/home-sections" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/api/store/grid-products" as="fetch" crossOrigin="anonymous" />
        <link rel="preload" href="/api/store/section4" as="fetch" crossOrigin="anonymous" />
      </head>
      <body className={`${outfit.className} antialiased bg-white`} suppressHydrationWarning>
        {/* Only Meta Pixel 1070471465441932 — no GTM / other trackers */}
        <MetaPixel />
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
