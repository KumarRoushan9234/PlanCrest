// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCnUfGISgRiwzWNl_TB0Zp_R4L5jGshdJ4",
  authDomain: "metabees-client.firebaseapp.com",
  projectId: "metabees-client",
  storageBucket: "metabees-client.firebasestorage.app",
  messagingSenderId: "150491440209",
  appId: "1:150491440209:web:1417e37e969d3304a30470",
  measurementId: "G-KBXHZTDH4L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);

// Initialize Google Auth Provider
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider, analytics };
export default app;
