
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDBtBT8JnazTAsVPg1sTPsPYZOJ-Rnnuyw",
  authDomain: "agentai-a83a2.firebaseapp.com",
  projectId: "agentai-a83a2",
  storageBucket: "agentai-a83a2.firebasestorage.app",
  messagingSenderId: "8445931941",
  appId: "1:8445931941:web:6c5216ada223b38412b84c",
  measurementId: "G-LBGVJY741M"
};

// Initialize Firebase
const app = !getApps.length ?  initializeApp(firebaseConfig) :getApp();

export const auth = getAuth(app);
export const db = getFirestore(app)