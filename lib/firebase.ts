// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFwWzkL7B0vIPwAh3dxSwd8jjJNX5GCpQ",
  authDomain: "test1-37071.firebaseapp.com",
  projectId: "test1-37071",
  storageBucket: "test1-37071.firebasestorage.app",
  messagingSenderId: "267011302063",
  appId: "1:267011302063:web:0b625eff16c108353a2a5a",
  measurementId: "G-1F8XN1663W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);