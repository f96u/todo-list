import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { initializeApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyAM8-6mkYp6nhrk9476QYXaIqv1jzrnwWc",
  authDomain: "todo-list-e8a5c.firebaseapp.com",
  projectId: "todo-list-e8a5c",
  storageBucket: "todo-list-e8a5c.firebasestorage.app",
  messagingSenderId: "769764513550",
  appId: "1:769764513550:web:a9c23f93c5cd61fa8ca95f",
  measurementId: "G-21NVBN3ZMH",
}

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
