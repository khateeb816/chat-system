import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getUserFromRequest, unauthorizedResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const appsSnapshot = await db.collection('apps')
      .where('ownerId', '==', user._id)
      .get();
      
    const appIds = appsSnapshot.docs.map(doc => doc.id);
    
    let totalApps = appIds.length;
    let totalApiCalls = 0;
    let activeSequences = 0;

    if (appIds.length > 0) {
      const chunks = [];
      for (let i = 0; i < appIds.length; i += 30) {
        chunks.push(appIds.slice(i, i + 30));
      }

      const progressPromises = chunks.map(chunk => 
        db.collection('appProgress')
          .where('appId', 'in', chunk)
          .get()
      );

      const progressSnapshots = await Promise.all(progressPromises);
      
      progressSnapshots.forEach(snap => {
        snap.forEach(doc => {
          const data = doc.data();
          totalApiCalls += (data.totalApiCalls || 0);
          if ((data.currentQuestionIndex || 0) > 0 || (data.currentAnswerIndex || 0) > 0 || data.currentMode === 'answer') {
            activeSequences++;
          }
        });
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalApps,
        totalApiCalls,
        activeSequences
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
