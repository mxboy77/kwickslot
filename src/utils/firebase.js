import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDpA3DhHgwfvDg6qznHmygJGTLCbNIPyyY",
  authDomain: "kwickslot.firebaseapp.com",
  projectId: "kwickslot",
  storageBucket: "kwickslot.firebasestorage.app",
  messagingSenderId: "919150734817",
  appId: "1:919150734817:web:9400da3ad421e2f08ef6a0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
