import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { checkRateLimit } from '@/lib/services/rateLimiter';
import { registerOrUpdateAgent } from '@/lib/services/agentService';
import { logApiRequest } from '@/lib/services/logService';

export async function POST(request, { params }) {
  try {
    const { appId } = await params;

    const agentId = request.headers.get('x-agent-id') || 'agent_fallback_reset';
    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    // 1. Rate Limiting Check
    const rateCheck = checkRateLimit(agentId);
    if (!rateCheck.allowed) {
      return NextResponse.json({
        success: false,
        message: rateCheck.reason === 'cooldown' 
          ? 'Too many requests - Cooldown active' 
          : 'Rate limit exceeded',
        retryAfter: rateCheck.retryAfter
      }, { status: 429 });
    }

    // 2. Register/Update Agent Status
    await registerOrUpdateAgent(agentId, { userAgent, ip });

    const snapshot = await db.collection('appProgress').where('appId', '==', appId).limit(1).get();

    if (!snapshot.empty) {
      await snapshot.docs[0].ref.update({
        currentQuestionIndex: 0,
        currentAnswerIndex: 0,
        currentMode: 'question',
        currentServingAgentId: agentId,
        lastServedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // 3. Log reset API call details
    await logApiRequest({
      appId,
      agentId,
      requestType: 'reset',
      returnedType: 'reset',
      returnedQuestionIndex: 0,
      returnedAnswerIndex: 0,
      ip,
      userAgent
    });

    return NextResponse.json({ success: true, message: 'App progress reset' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
