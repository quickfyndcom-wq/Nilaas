"use client";
import ReduxProvider from "@/lib/ReduxProvider";
import Navbar from "@/components/Navbar";
import TopBarNotification from "@/components/TopBarNotification";
import Footer from "@/components/Footer";
import StoreProvider from "@/app/StoreProvider";
import { Toaster } from "react-hot-toast";

export default function ClientLayout({ children }) {
  return (
    <ReduxProvider>
      <TopBarNotification />
      <Navbar />
      <StoreProvider>
        <Toaster />
        {children}
      </StoreProvider>
      {/* SupportBar removed as per request */}
      <Footer />
    </ReduxProvider>
  );
}
