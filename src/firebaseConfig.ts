import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "health-navigator-project.firebaseapp.com",
  projectId: "health-navigator-project",
  storageBucket: "health-navigator-project.firebasestorage.app", 
  messagingSenderId: "336700843137",
  appId: "1:336700843137:web:15e63a622d880450885980",
  measurementId: "G-28FB9T17LJ"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };