import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCjbSMJqAxssg7W9YYQmEv1CGlh6ioMupY",
    authDomain: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? "torquex-b2f0e.firebaseapp.com"
        : window.location.hostname,
    projectId: "torquex-b2f0e",
    storageBucket: "torquex-b2f0e.firebasestorage.app",
    messagingSenderId: "402373338025",
    appId: "1:402373338025:web:e4364ae1a13b91e1859ab8",
    measurementId: "G-FBNBL3CKE1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
