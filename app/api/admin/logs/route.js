import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getUserFromRequest, forbiddenResponse } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'Admin') return forbiddenResponse();

    const logsSnapshot = await db.collection('apiRequestLogs').get();
    
    // Cache app names in memory to avoid redundant queries
    const appCache = {};

    const logs = await Promise.all(logsSnapshot.docs.map(async (doc) => {
      const logData = doc.data();
      const appId = logData.appId;
      
      let appName = 'Unknown';
      if (appId) {
        if (appCache[appId]) {
          appName = appCache[appId];
        } else {
          const appDoc = await db.collection('apps').doc(appId).get();
          if (appDoc.exists) {
            appName = appDoc.data().name;
            appCache[appId] = appName;
          }
        }
      }

      return {
        _id: doc.id,
        ...logData,
        appName
      };
    }));

    // Sort by timestamp desc in memory and slice to 100
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentLogs = logs.slice(0, 100);

    return NextResponse.json({ success: true, data: recentLogs });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
