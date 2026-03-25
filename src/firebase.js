import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA-EY7j98F4WMOOuWPZmUOUcDgHJcDPdgc",
  authDomain: "grassroots-sports.firebaseapp.com",
  projectId: "grassroots-sports",
  storageBucket: "grassroots-sports.firebasestorage.app",
  messagingSenderId: "1004379006027",
  appId: "1:1004379006027:web:4ff5f59f0daeace12bd9ce",
  measurementId: "G-T05D3367RD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export default app;