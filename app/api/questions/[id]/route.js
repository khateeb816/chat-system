import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getUserFromRequest, unauthorizedResponse, forbiddenResponse } from '@/lib/auth';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const docRef = db.collection('questions').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });

    if (user.role !== 'Admin') {
      const appDoc = await db.collection('apps').doc(doc.data().appId).get();
      if (!appDoc.exists || appDoc.data().ownerId !== user._id) return forbiddenResponse();
    }

    const body = await request.json();
    await docRef.update({ ...body, updatedAt: new Date().toISOString() });
    const updated = await docRef.get();
    return NextResponse.json({ success: true, data: { _id: updated.id, ...updated.data() } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user) return unauthorizedResponse();

    const docRef = db.collection('questions').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ success: false, message: 'Question not found' }, { status: 404 });

    if (user.role !== 'Admin') {
      const appDoc = await db.collection('apps').doc(doc.data().appId).get();
      if (!appDoc.exists || appDoc.data().ownerId !== user._id) return forbiddenResponse();
    }

    await docRef.delete();
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
