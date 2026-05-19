import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import bcrypt from 'bcrypt';
import { generateToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password, role } = await request.json();

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
      token: generateToken(docRef.id),
      user: { id: docRef.id, email: newUser.email, role: newUser.role }
    }, { status: 201 });
  } catch (error) {
    console.error('[Register Error]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
