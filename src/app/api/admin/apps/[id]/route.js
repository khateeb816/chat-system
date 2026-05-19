import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getUserFromRequest, forbiddenResponse } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'Admin') return forbiddenResponse();

    const appDoc = await db.collection('apps').doc(id).get();
    if (!appDoc.exists) return NextResponse.json({ success: false, message: 'App not found' }, { status: 404 });

    const appData = appDoc.data();
    const ownerDoc = await db.collection('users').doc(appData.ownerId).get();
    const ownerEmail = ownerDoc.exists ? ownerDoc.data().email : 'Unknown';

    const [questionsSnap, progressSnap, logsSnap] = await Promise.all([
      db.collection('questions').where('appId', '==', id).get(),
      db.collection('appProgress').where('appId', '==', id).limit(1).get(),
      db.collection('activityLogs').where('appId', '==', id).get()
    ]);

    const questions = questionsSnap.docs
      .map(doc => ({ _id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    const progress = progressSnap.empty ? null : { _id: progressSnap.docs[0].id, ...progressSnap.docs[0].data() };
    const logs = logsSnap.docs
      .map(doc => ({ _id: doc.id, ...doc.data() }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);
    const totalAnswers = questions.reduce((acc, q) => acc + (q.answers ? q.answers.length : 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        app: { 
          _id: appDoc.id, 
          ...appData, 
          ownerEmail,
          ownerId: {
            _id: appData.ownerId,
            email: ownerEmail
          }
        },
        questions,
        progress,
        logs,
        stats: { totalQuestions: questions.length, totalAnswers }
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'Admin') return forbiddenResponse();

    const appDoc = await db.collection('apps').doc(id).get();
    if (!appDoc.exists) return NextResponse.json({ success: false, message: 'App not found' }, { status: 404 });

    await db.collection('apps').doc(id).delete();

    const [progressSnap, questionsSnap] = await Promise.all([
      db.collection('appProgress').where('appId', '==', id).get(),
      db.collection('questions').where('appId', '==', id).get()
    ]);
    progressSnap.forEach(doc => doc.ref.delete());
    questionsSnap.forEach(doc => doc.ref.delete());

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
