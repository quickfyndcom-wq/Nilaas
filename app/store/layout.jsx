'use client'
import StoreLayout from "@/components/store/StoreLayout";

export default function RootAdminLayout({ children }) {
    return (
        <StoreLayout>
            {children}
        </StoreLayout>
    );
}
