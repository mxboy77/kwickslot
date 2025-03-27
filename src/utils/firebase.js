import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDpA3DhHgwfvDg6qznHmygJGTLCbNIPyyY",
  authDomain: "kwickslot.firebaseapp.com",
  projectId: "kwickslot",
  storageBucket: "kwickslot.appspot.com",
  messagingSenderId: "919150734817",
  appId: "1:919150734817:web:9400da3ad421e2f08ef6a0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
