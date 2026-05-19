import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getUserFromRequest, forbiddenResponse } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'Admin') return forbiddenResponse();

    const appsSnapshot = await db.collection('apps').orderBy('createdAt', 'desc').get();
    
    // Get owner emails in parallel
    const apps = await Promise.all(appsSnapshot.docs.map(async (doc) => {
      const appData = doc.data();
      const ownerDoc = await db.collection('users').doc(appData.ownerId).get();
      const ownerEmail = ownerDoc.exists ? ownerDoc.data().email : 'Unknown';
      return { 
        _id: doc.id, 
        ...appData, 
        ownerId: {
          _id: appData.ownerId,
          email: ownerEmail
        }
      };
    }));

    return NextResponse.json({ success: true, data: apps });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
