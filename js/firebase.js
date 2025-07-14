// Import the functions you need from the SDKs you need
//import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAyH2I3ngh3d13qV96uB7PTDXVLU6ydXnE",
  authDomain: "neuronotes-25ee8.firebaseapp.com",
  projectId: "neuronotes-25ee8",
  storageBucket: "neuronotes-25ee8.firebasestorage.app",
  messagingSenderId: "286811803215",
  appId: "1:286811803215:web:f64ba6032e29542322a43a"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig); // <-- This is the v8/namespaced way


// Optional: export handles to use later in other scripts if needed
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();