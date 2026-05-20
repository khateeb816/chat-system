import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getUserFromRequest, forbiddenResponse } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'Admin') return forbiddenResponse();

    const logsSnapshot = await db.collection('apiRequestLogs').get();
    
    // Caches to avoid redundant queries during the request
    const appCache = {};
    const questionsCache = {};

    const logs = await Promise.all(logsSnapshot.docs.map(async (doc) => {
      const logData = doc.data();
      const appId = logData.appId;
      
      let appName = 'Unknown';
      let returnedQuestionText = null;
      let returnedAnswerText = null;

      if (appId) {
        // Fetch app name
        if (appCache[appId]) {
          appName = appCache[appId];
        } else {
          const appDoc = await db.collection('apps').doc(appId).get();
          if (appDoc.exists) {
            appName = appDoc.data().name;
            appCache[appId] = appName;
          }
        }

        // Fetch and cache questions for this app to look up by index
        let questions = [];
        if (questionsCache[appId]) {
          questions = questionsCache[appId];
        } else {
          try {
            const qSnapshot = await db.collection('questions')
              .where('appId', '==', appId)
              .get();
            questions = qSnapshot.docs
              .map(d => d.data())
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
            questionsCache[appId] = questions;
          } catch (e) {
            console.error(`Failed to fetch questions for app ${appId}:`, e);
          }
        }

        // Resolve question text
        if (logData.returnedQuestionIndex !== null && logData.returnedQuestionIndex !== undefined) {
          const qIndex = logData.returnedQuestionIndex;
          const question = questions[qIndex];
          if (question) {
            returnedQuestionText = question.text;

            // Resolve answer text
            if (logData.returnedAnswerIndex !== null && logData.returnedAnswerIndex !== undefined) {
              const aIndex = logData.returnedAnswerIndex;
              const answers = question.answers || [];
              const answer = answers[aIndex];
              if (answer) {
                returnedAnswerText = typeof answer === 'string' ? answer : (answer.text || answer.answer || '');
              }
            }
          }
        }
      }

      return {
        _id: doc.id,
        ...logData,
        appName,
        returnedQuestionText,
        returnedAnswerText
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
