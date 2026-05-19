import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { checkRateLimit } from '@/lib/services/rateLimiter';
import { registerOrUpdateAgent } from '@/lib/services/agentService';
import { logApiRequest } from '@/lib/services/logService';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { appId } = await params;

    const agentId = request.headers.get('x-agent-id') || 'agent_fallback_test';
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

    const appDoc = await db.collection('apps').doc(appId).get();
    if (!appDoc.exists) {
      return NextResponse.json({ success: false, message: 'App not found or inactive' }, { status: 404 });
    }

    const questionsSnapshot = await db.collection('questions')
      .where('appId', '==', appId)
      .get();

    const questions = questionsSnapshot.docs
      .map(doc => ({ _id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    if (questions.length === 0) {
      return NextResponse.json({ success: false, message: 'No questions found for this app' }, { status: 404 });
    }

    let progressRef;
    let progress;
    const progressSnapshot = await db.collection('appProgress').where('appId', '==', appId).limit(1).get();

    if (progressSnapshot.empty) {
      const newProgress = {
        appId,
        currentQuestionIndex: 0,
        currentAnswerIndex: 0,
        currentMode: 'question',
        totalApiCalls: 0,
        lastAccessedAt: new Date().toISOString()
      };
      progressRef = await db.collection('appProgress').add(newProgress);
      progress = newProgress;
    } else {
      progressRef = progressSnapshot.docs[0].ref;
      progress = progressSnapshot.docs[0].data();
    }

    let { currentQuestionIndex, currentAnswerIndex, currentMode } = progress;
    const newTotalCalls = (progress.totalApiCalls || 0) + 1;

    if (currentQuestionIndex >= questions.length) {
      currentQuestionIndex = 0;
      currentAnswerIndex = 0;
      currentMode = 'question';
    }

    const currentQuestion = questions[currentQuestionIndex];
    let responseData = {};
    
    // Prepare session and serving history (for self-response prevention architecture)
    const servingHistory = progress.servingHistory || [];
    const servingEvent = {
      agentId,
      questionIndex: currentQuestionIndex,
      mode: currentMode,
      timestamp: new Date().toISOString()
    };

    let newProgress = { 
      totalApiCalls: newTotalCalls, 
      lastAccessedAt: new Date().toISOString(),
      currentServingAgentId: agentId,
      lastServedAt: new Date().toISOString(),
      servingHistory: [...servingHistory, servingEvent].slice(-50)
    };

    if (currentMode === 'question') {
      responseData = {
        success: true,
        type: 'question',
        question: currentQuestion.text,
        questionIndex: currentQuestionIndex
      };
      newProgress.currentMode = 'answer';
      newProgress.currentQuestionIndex = currentQuestionIndex;
      newProgress.currentAnswerIndex = currentAnswerIndex;
    } else {
      const answers = currentQuestion.answers || [];

      if (answers.length > 0 && currentAnswerIndex < answers.length) {
        responseData = {
          success: true,
          type: 'answer',
          answer: answers[currentAnswerIndex].text,
          questionIndex: currentQuestionIndex,
          answerIndex: currentAnswerIndex
        };

        const nextAnswerIndex = currentAnswerIndex + 1;
        if (nextAnswerIndex >= answers.length) {
          let nextQuestionIndex = currentQuestionIndex + 1;
          if (nextQuestionIndex >= questions.length) nextQuestionIndex = 0;
          newProgress.currentQuestionIndex = nextQuestionIndex;
          newProgress.currentAnswerIndex = 0;
          newProgress.currentMode = 'question';
        } else {
          newProgress.currentQuestionIndex = currentQuestionIndex;
          newProgress.currentAnswerIndex = nextAnswerIndex;
          newProgress.currentMode = 'answer';
        }
      } else {
        let nextQuestionIndex = currentQuestionIndex + 1;
        if (nextQuestionIndex >= questions.length) nextQuestionIndex = 0;
        const nextQuestion = questions[nextQuestionIndex];

        responseData = {
          success: true,
          type: 'question',
          question: nextQuestion.text,
          questionIndex: nextQuestionIndex
        };
        newProgress.currentQuestionIndex = nextQuestionIndex;
        newProgress.currentAnswerIndex = 0;
        newProgress.currentMode = 'answer';
      }
    }

    await progressRef.update(newProgress);
    
    // Log API call details
    await logApiRequest({
      appId,
      agentId,
      requestType: 'next',
      returnedType: responseData.type,
      returnedQuestionIndex: responseData.questionIndex,
      returnedAnswerIndex: responseData.answerIndex,
      ip,
      userAgent
    });

    db.collection('activityLogs').add({ appId, action: 'PUBLIC_API_CALLED', createdAt: new Date().toISOString() }).catch(console.error);

    return NextResponse.json(responseData);
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
