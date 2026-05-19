import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getUserFromRequest, forbiddenResponse } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'Admin') return forbiddenResponse();

    const snapshot = await db.collection('agents').get();
    const agents = snapshot.docs.map(doc => ({ _id: doc.id, ...doc.data() }));

    // Sort by lastSeenAt desc in memory
    agents.sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt));

    return NextResponse.json({ success: true, data: agents });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
