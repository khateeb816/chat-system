import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getUserFromRequest, forbiddenResponse } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'Admin') return forbiddenResponse();

    const progressSnap = await db.collection('appProgress').get();
    
    const sessions = await Promise.all(progressSnap.docs.map(async (doc) => {
      const progData = doc.data();
      const appId = progData.appId;

      let appName = 'Unknown App';
      let ownerEmail = 'Unknown';

      if (appId) {
        const appDoc = await db.collection('apps').doc(appId).get();
        if (appDoc.exists) {
          const appData = appDoc.data();
          appName = appData.name;
          
          if (appData.ownerId) {
            const ownerDoc = await db.collection('users').doc(appData.ownerId).get();
            if (ownerDoc.exists) {
              ownerEmail = ownerDoc.data().email;
            }
          }
        }
      }

      return {
        _id: doc.id,
        ...progData,
        appName,
        ownerEmail
      };
    }));

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
