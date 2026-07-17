'use client'


import Link from "next/link"
import { useAuth } from "@/lib/useAuth";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";


const StoreNavbar = ({ storeInfo }) => {
    const { user } = useAuth();

    const handleLogout = async () => {
        if (user) {
            // Firebase logout
            await signOut(auth);
            window.location.href = "/";
        }
    };

    return (
        <div className="flex items-center justify-between px-12 py-3 border-b border-slate-200 transition-all">
            <div className="flex items-center gap-3">
                <p>Hi, {storeInfo?.name || user?.displayName || user?.name || user?.email || ''}</p>
            </div>
        </div>
    )
}

export default StoreNavbar