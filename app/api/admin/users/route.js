import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getUserFromRequest, forbiddenResponse } from '@/lib/auth';
import bcrypt from 'bcrypt';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'Admin') return forbiddenResponse();

    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => {
      const { password, ...userData } = doc.data();
      return { _id: doc.id, ...userData };
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'Admin') return forbiddenResponse();

    const { email, password, role } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required' }, { status: 400 });
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();
    if (!snapshot.empty) {
      return NextResponse.json({ success: false, message: 'User already exists' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      email,
      password: hashedPassword,
      role: role || 'User',
      createdAt: new Date().toISOString()
    };

    const docRef = await usersRef.add(newUser);

    return NextResponse.json({
      success: true,
      data: { _id: docRef.id, email: newUser.email, role: newUser.role, createdAt: newUser.createdAt }
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
