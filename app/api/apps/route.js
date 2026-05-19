import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getUserFromRequest, unauthorizedResponse } from '@/lib/auth';
import crypto from 'crypto';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const snapshot = await db.collection('apps')
      .where('ownerId', '==', user._id)
      .get();
      
    const apps = snapshot.docs
      .map(doc => {
        const data = doc.data();
        let updated = false;
        if (!data.apiKey) {
          data.apiKey = crypto.randomBytes(16).toString('hex');
          updated = true;
        }
        if (!data.status) {
          data.status = 'active';
          updated = true;
        }
        if (updated) {
          db.collection('apps').doc(doc.id).update({
            apiKey: data.apiKey,
            status: data.status
          }).catch(console.error);
        }
        return { _id: doc.id, ...data };
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return NextResponse.json({ success: true, data: apps });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const { name, description } = await request.json();
    
    const appData = {
      name,
      description,
      ownerId: user._id,
      apiKey: crypto.randomBytes(16).toString('hex'),
      status: 'active',
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('apps').add(appData);
    const app = { _id: docRef.id, ...appData };

    await db.collection('appProgress').add({ 
      appId: docRef.id,
      currentQuestionIndex: 0,
      currentAnswerIndex: 0,
      currentMode: 'question',
      totalApiCalls: 0
    });

    await db.collection('activityLogs').add({
      userId: user._id,
      appId: docRef.id,
      action: 'APP_CREATED',
      createdAt: new Date().toISOString()
    });

    return NextResponse.json({ success: true, data: app }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
