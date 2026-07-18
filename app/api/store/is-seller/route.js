import dbConnect from "@/lib/mongodb";
import Store from "@/models/Store";
import authSeller from "@/middlewares/authSeller";
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/firebase-admin";

export async function GET(request) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('[is-seller API] Missing or invalid authorization header:', authHeader);
            return NextResponse.json({ isSeller: false, reason: 'missing-auth-header' }, { status: 200 });
        }
        const idToken = authHeader.split(' ')[1];
        let decodedToken;
        try {
            decodedToken = await getAuth().verifyIdToken(idToken);
        } catch (err) {
            console.log('[is-seller API] Invalid or expired token:', err.message);
            return NextResponse.json({ isSeller: false, reason: 'invalid-token' }, { status: 200 });
        }
        const userId = decodedToken.uid;
        const userEmail = decodedToken.email;
        console.log('[is-seller API] Checking seller status for:', userEmail);

        // Allow admin email without Store record
        const allowedEmail = (process.env.NEXT_PUBLIC_STORE_ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'quickfynd.com@gmail.com').toLowerCase();
        if (userEmail?.toLowerCase() === allowedEmail) {
            console.log('[is-seller API] ✅ Authorized email, granting access without Store check');
            return NextResponse.json({ 
                isSeller: true, 
                isAdmin: true,
                storeInfo: { name: 'Nilaas Store', status: 'approved' }, 
                userId 
            });
        }

        // For other users, check Store record
        console.log('[is-seller API] Checking Store record for:', userId);
        const sellerResult = await authSeller(userId);
        console.log('[is-seller API] authSeller result:', sellerResult);
        if(!sellerResult){
            // Not a seller or not approved
            console.log('[is-seller API] User is NOT a seller (authSeller returned false)');
            return NextResponse.json({ isSeller: false, userId, reason: 'not-seller-or-not-approved' }, { status: 200 });
        }
        console.log('[is-seller API] User IS a seller, fetching store info...');
        await dbConnect();
        const storeInfo = await Store.findOne({userId}).lean();
        console.log('[is-seller API] Store info:', storeInfo ? 'Found' : 'Not found');
        return NextResponse.json({ isSeller: true, storeInfo, userId });
    } catch (error) {
        console.error('[is-seller API] Error:', error);
        return NextResponse.json({ isSeller: false, reason: 'server-error', message: error.code || error.message }, { status: 200 });
    }
}