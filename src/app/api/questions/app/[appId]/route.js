import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getUserFromRequest, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { appId } = await params;
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const snapshot = await db.collection('questions')
      .where('appId', '==', appId)
      .get();

    const questions = snapshot.docs
      .map(doc => ({ _id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return NextResponse.json({ success: true, data: questions });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

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
    const questionData = {
      appId,
      text: body.text,
      answers: body.answers || [],
      sortOrder: body.sortOrder || 0,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('questions').add(questionData);
    return NextResponse.json({ success: true, data: { _id: docRef.id, ...questionData } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
