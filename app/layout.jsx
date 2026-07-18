import { Outfit } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import React from "react";
import MetaPixel from "@/components/MetaPixel";
import SocialProofPopup from "@/components/SocialProofPopup";
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
        {/* Google Tag Manager (noscript must be immediately after <body>) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5QLZ2255"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* Google Tag Manager - load after interactive */}
        <Script id="gtm" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-5QLZ2255');
          `}
        </Script>
        <MetaPixel />
        {/* Add Navbar and Footer globally via ClientLayout */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
