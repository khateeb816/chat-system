import { db } from '../firebase';

export async function registerOrUpdateAgent(agentId, { userAgent = '', ip = '', userId = null } = {}) {
  if (!agentId) return null;

  const agentRef = db.collection('agents').doc(agentId);
  const doc = await agentRef.get();

  const now = new Date().toISOString();
  
  // Extract simple browser name from UA
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  const metadata = {
    userAgent,
    ip,
    browser
  };

  if (!doc.exists) {
    const newAgent = {
      agentId,
      userId,
      createdAt: now,
      lastSeenAt: now,
      totalRequests: 1,
      status: 'online',
      metadata
    };
    await agentRef.set(newAgent);
    return newAgent;
  } else {
    const currentData = doc.data();
    const updatedAgent = {
      lastSeenAt: now,
      totalRequests: (currentData.totalRequests || 0) + 1,
      status: 'online',
      metadata: { ...currentData.metadata, ...metadata }
    };
    if (userId) {
      updatedAgent.userId = userId;
    }
    await agentRef.update(updatedAgent);
    return { ...currentData, ...updatedAgent };
  }
}

export async function getAgent(agentId) {
  const doc = await db.collection('agents').doc(agentId).get();
  return doc.exists ? doc.data() : null;
}
