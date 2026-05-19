import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    let serviceAccountVar = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountVar) {
      serviceAccountVar = serviceAccountVar.trim();
      
      // Extract only the JSON object boundaries to strip any trailing/leading junk characters
      const firstBrace = serviceAccountVar.indexOf('{');
      const lastBrace = serviceAccountVar.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        serviceAccountVar = serviceAccountVar.slice(firstBrace, lastBrace + 1);
      }
      
      let serviceAccount = JSON.parse(serviceAccountVar);
      if (typeof serviceAccount === 'string') {
        serviceAccount = JSON.parse(serviceAccount);
      }
      
      // Fix escaped newlines in private key (common issue with env vars)
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      });
    } else {
      admin.initializeApp({
        projectId: 'chat-system-67471'
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error:', error.message);
    // Fallback initialization to prevent build-time crashes if JSON parsing failed
    try {
      admin.initializeApp({
        projectId: 'chat-system-67471'
      });
    } catch (fallbackError) {
      // Ignore if already initialized
    }
  }
}

export const db = admin.firestore();
