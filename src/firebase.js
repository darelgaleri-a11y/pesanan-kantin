import { initializeApp } from "firebase/app";
import {
  getAuth
} from "firebase/auth";
import {
  getFirestore
} from "firebase/firestore";


const firebaseConfig = {

  apiKey: "AIzaSyCDbh7TmMxihUMiIZEP4n4Sr8yrExPqnmY",

  authDomain:
    "pesanan-kantin.firebaseapp.com",

  projectId:
    "pesanan-kantin",

  storageBucket:
    "pesanan-kantin.firebasestorage.app",

  messagingSenderId:
    "501189580372",

  appId:
    "1:501189580372:web:97c9c3f9f33b5ace847fc1",

  measurementId:
    "G-J8ERTMQMF5"

};


const app =
  initializeApp(
    firebaseConfig
  );


export const db =
  getFirestore(app);


export const auth =
  getAuth(app);


export default app;