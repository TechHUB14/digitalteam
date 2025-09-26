// Import the functions you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOyohRuKhoPyYdXtpJzPTIISutL3HHGmQ",
  authDomain: "digiteam-a590f.firebaseapp.com",
  projectId: "digiteam-a590f",
  storageBucket: "digiteam-a590f.firebasestorage.app",
  messagingSenderId: "554834686885",
  appId: "1:554834686885:web:fe08b115e112e5aa6f2e4c",
  measurementId: "G-6RZ15PXP7B",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Optional: Analytics (only works in browsers with Measurement ID enabled)
export const analytics = getAnalytics(app);
