import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getUserFromRequest, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const { appId } = await params;
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    if (user.role !== 'Admin') {
      const appDoc = await db.collection('apps').doc(appId).get();
      if (!appDoc.exists || appDoc.data().ownerId !== user._id) {
        return forbiddenResponse();
      }
    }

    const body = await request.json();
    const { questions } = body;
    if (!Array.isArray(questions)) {
      return NextResponse.json({ success: false, error: 'Questions must be an array' }, { status: 400 });
    }

    // Get current max sortOrder
    const snapshot = await db.collection('questions')
      .where('appId', '==', appId)
      .get();
    
    let maxSortOrder = -1;
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.sortOrder !== undefined && data.sortOrder > maxSortOrder) {
        maxSortOrder = data.sortOrder;
      }
    });

    const batchArray = [];
    let currentBatch = db.batch();
    let count = 0;
    const createdQuestions = [];

    questions.forEach((q, index) => {
      const docRef = db.collection('questions').doc();
      const questionData = {
        appId,
        text: q.text || '',
        answers: (q.answers || []).map((a, aIndex) => {
          if (typeof a === 'string') {
            return { text: a, sortOrder: aIndex };
          }
          return { text: a.text || '', sortOrder: a.sortOrder !== undefined ? a.sortOrder : aIndex };
        }),
        sortOrder: maxSortOrder + 1 + index,
        createdAt: new Date().toISOString()
      };
      
      currentBatch.set(docRef, questionData);
      createdQuestions.push({ _id: docRef.id, ...questionData });
      
      count++;
      if (count === 490) { // Limit is 500, using 490 to be safe
        batchArray.push(currentBatch);
        currentBatch = db.batch();
        count = 0;
      }
    });
    
    if (count > 0) {
      batchArray.push(currentBatch);
    }
    
    for (const b of batchArray) {
      await b.commit();
    }

    return NextResponse.json({ success: true, count: createdQuestions.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
