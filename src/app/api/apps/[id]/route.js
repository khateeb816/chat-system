import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getUserFromRequest, unauthorizedResponse } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const docRef = db.collection('apps').doc(id);
    const doc = await docRef.get();
    
    if (!doc.exists || doc.data().ownerId !== user._id) {
      return NextResponse.json({ success: false, message: 'App not found' }, { status: 404 });
    }

    const docData = doc.data();
    let updated = false;
    if (!docData.apiKey) {
      docData.apiKey = require('crypto').randomBytes(16).toString('hex');
      updated = true;
    }
    if (!docData.status) {
      docData.status = 'active';
      updated = true;
    }
    if (updated) {
      await docRef.update({
        apiKey: docData.apiKey,
        status: docData.status
      });
    }
    
    return NextResponse.json({ success: true, data: { _id: doc.id, ...docData } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const docRef = db.collection('apps').doc(id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().ownerId !== user._id) {
      return NextResponse.json({ success: false, message: 'App not found' }, { status: 404 });
    }

    const body = await request.json();
    await docRef.update({ ...body, updatedAt: new Date().toISOString() });
    
    const updatedDoc = await docRef.get();
    return NextResponse.json({ success: true, data: { _id: updatedDoc.id, ...updatedDoc.data() } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const docRef = db.collection('apps').doc(id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data().ownerId !== user._id) {
      return NextResponse.json({ success: false, message: 'App not found' }, { status: 404 });
    }

    await docRef.delete();
    
    const [progressSnapshot, questionsSnapshot] = await Promise.all([
      db.collection('appProgress').where('appId', '==', id).get(),
      db.collection('questions').where('appId', '==', id).get()
    ]);
    progressSnapshot.forEach(doc => doc.ref.delete());
    questionsSnapshot.forEach(doc => doc.ref.delete());

    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
