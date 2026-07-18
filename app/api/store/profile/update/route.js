import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { getAuth } from "@/lib/firebase-admin";

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await getAuth().verifyIdToken(idToken);
    const userId = decodedToken.uid;
    await dbConnect();
    const { name, image, email } = await request.json();
    await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          ...(name != null ? { name } : {}),
          ...(image != null ? { image } : {}),
          ...(email != null ? { email } : {}),
        },
        $setOnInsert: { _id: userId },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return NextResponse.json({ message: 'Profile updated' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
