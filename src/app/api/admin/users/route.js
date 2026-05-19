import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getUserFromRequest, forbiddenResponse } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'Admin') return forbiddenResponse();

    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => {
      const { password, ...userData } = doc.data();
      return { _id: doc.id, ...userData };
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
