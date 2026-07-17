import connectDB from '@/lib/mongoose';
import User from '@/models/User';
import Store from '@/models/Store';

const getAllowedAdminEmail = () =>
  (process.env.NEXT_PUBLIC_STORE_ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'quickfynd.com@gmail.com')
    .toLowerCase()
    .trim();

async function resolveUserEmail(userId) {
  // Prefer Mongo user, fall back to Firebase Auth profile
  try {
    const user = await User.findById(userId).lean();
    if (user?.email) return String(user.email).toLowerCase();
  } catch {
    // ignore
  }

  try {
    const { getAuth } = await import('@/lib/firebase-admin');
    const firebaseUser = await getAuth().getUser(userId);
    if (firebaseUser?.email) return String(firebaseUser.email).toLowerCase();
  } catch (e) {
    console.log('[authSeller] Could not resolve email from Firebase:', e?.message);
  }

  return null;
}

async function provisionStore(userId, email) {
  const allowedEmail = getAllowedAdminEmail();
  const baseUsername = (email?.split('@')[0] || 'nilaas').toLowerCase().replace(/[^a-z0-9]/g, '') || 'nilaas';
  let username = baseUsername;
  let suffix = 0;
  while (suffix < 10) {
    const exists = await Store.findOne({ username }).lean();
    if (!exists) break;
    suffix += 1;
    username = `${baseUsername}${suffix}`;
  }

  const newStore = await Store.create({
    name: 'Nilaas',
    userId,
    username,
    email: email || allowedEmail,
    description: 'Nilaas ladies fashion',
    isActive: true,
    status: 'approved',
  });

  // Keep a User row in sync so later checks succeed
  try {
    await User.findByIdAndUpdate(
      userId,
      {
        _id: userId,
        email: email || allowedEmail,
        name: 'Nilaas Admin',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (e) {
    console.log('[authSeller] User upsert skipped:', e?.message);
  }

  console.log('[authSeller] Store created:', newStore._id.toString());
  return newStore._id.toString();
}

const authSeller = async (userId) => {
  try {
    if (!userId) {
      console.log('[authSeller] No userId provided');
      return false;
    }
    await connectDB();

    let store = await Store.findOne({ userId }).lean();
    console.log('[authSeller] Store found:', store ? `Yes (${store._id})` : 'No');
    console.log('[authSeller] Store status:', store?.status);

    if (store && (store.status === 'approved' || store.status === 'pending' || store.isActive)) {
      return store._id.toString();
    }

    if (store && store.status === 'rejected') {
      console.log('[authSeller] Store rejected');
      return false;
    }

    // Auto-provision for the store admin email (Nilaas single-owner setup)
    const email = await resolveUserEmail(userId);
    const allowedEmail = getAllowedAdminEmail();
    if (email && email === allowedEmail) {
      console.log('[authSeller] No store for admin email — creating Nilaas store…');
      return await provisionStore(userId, email);
    }

    console.log('[authSeller] No store and email is not admin:', email);
    return false;
  } catch (error) {
    console.log('[authSeller] Error:', error);
    return false;
  }
};

export default authSeller;
