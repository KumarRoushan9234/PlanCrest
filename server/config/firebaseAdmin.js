import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

/**
 * Google sign-in is optional. It is enabled when FIREBASE_PROJECT_ID is set.
 * Verifying ID tokens only needs the project ID (Google's public signing
 * keys are fetched automatically); a service account is used if provided.
 */
export const isFirebaseEnabled = () => Boolean(process.env.FIREBASE_PROJECT_ID);

let auth = null;

export const getFirebaseAuth = () => {
  if (!isFirebaseEnabled()) return null;
  if (auth) return auth;

  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  const options = { projectId: FIREBASE_PROJECT_ID };
  if (FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    options.credential = cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    });
  }

  const app = getApps()[0] || initializeApp(options);
  auth = getAuth(app);
  return auth;
};
