import jwt from 'jsonwebtoken';
import { db } from './firebase';
import { NextResponse } from 'next/server';

export async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const userDoc = await db.collection('users').doc(decoded.id).get();
    
    if (!userDoc.exists) return null;
    
    return { _id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    return null;
  }
}

export function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d'
  });
}

export function unauthorizedResponse() {
  return NextResponse.json({ success: false, message: 'Not authorized' }, { status: 401 });
}

export function forbiddenResponse() {
  return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
}
