// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCo29MY4Fpe0riC_9-GYJwadIaggFDOcLE",
  authDomain: "shoppersecom-6ca78.firebaseapp.com",
  projectId: "shoppersecom-6ca78",
  storageBucket: "shoppersecom-6ca78.firebasestorage.app",
  messagingSenderId: "493208557871",
  appId: "1:493208557871:web:b1fe587778eb8da54569da",
  measurementId: "G-L27Q3LHCWY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);