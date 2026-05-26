import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCDVVTxDyUVHjbQa4GTuVqJTjYCVLaZqbM",
  authDomain: "task-management-71ea8.firebaseapp.com",
  projectId: "task-management-71ea8",
  storageBucket: "task-management-71ea8.firebasestorage.app",
  messagingSenderId: "392233082538",
  appId: "1:392233082538:web:803bd6ec291de13626bad3",
  measurementId: "G-8SPZDWS453"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();