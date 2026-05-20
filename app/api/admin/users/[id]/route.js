import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getUserFromRequest, forbiddenResponse } from '@/lib/auth';
import bcrypt from 'bcrypt';

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'Admin') return forbiddenResponse();

    const userDocRef = db.collection('users').doc(id);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const { email, password, role } = await request.json();

    // Check if email is already taken by another user
    if (email && email !== userDoc.data().email) {
      const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
      if (!snapshot.empty) {
        return NextResponse.json({ success: false, message: 'Email already in use' }, { status: 400 });
      }
    }

    const updatedData = {};
    if (email) updatedData.email = email;
    if (role) updatedData.role = role;
    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      updatedData.password = await bcrypt.hash(password, salt);
    }
    updatedData.updatedAt = new Date().toISOString();

    await userDocRef.update(updatedData);

    return NextResponse.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'Admin') return forbiddenResponse();

    const userDocRef = db.collection('users').doc(id);
    const userDoc = await userDocRef.get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Protect against self-deletion
    if (id === user._id) {
      return NextResponse.json({ success: false, message: 'Cannot delete your own admin account' }, { status: 400 });
    }

    await userDocRef.delete();

    return NextResponse.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
