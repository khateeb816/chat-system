import { db } from '../firebase';

export async function logApiRequest({
  appId,
  agentId,
  requestType,
  returnedType,
  returnedQuestionIndex = null,
  returnedAnswerIndex = null,
  ip = '',
  userAgent = ''
}) {
  try {
    const logData = {
      appId,
      agentId,
      requestType,
      returnedType,
      returnedQuestionIndex,
      returnedAnswerIndex,
      timestamp: new Date().toISOString(),
      ip,
      userAgent
    };
    await db.collection('apiRequestLogs').add(logData);
    return logData;
  } catch (error) {
    console.error('Failed to write API log:', error);
    return null;
  }
}
