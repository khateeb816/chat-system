import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { getUserFromRequest, unauthorizedResponse } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return unauthorizedResponse();
    }

    const { password, ...userData } = user; // Exclude password
    return NextResponse.json({ success: true, data: userData });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
