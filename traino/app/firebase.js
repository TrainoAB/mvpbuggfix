// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import {getAuth} from "firebase/auth"
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAZg_32MeeUumVa0LlQFs7qD8VlzmI1NEQ",
  authDomain: "nextjs-auth-89744.firebaseapp.com",
  projectId: "nextjs-auth-89744",
  storageBucket: "nextjs-auth-89744.appspot.com",
  messagingSenderId: "588098269195",
  appId: "1:588098269195:web:c0ef5c165e2e46502b570e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app)