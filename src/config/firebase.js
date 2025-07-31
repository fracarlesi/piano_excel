// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDHmREPuqzW_qCL6TkoOwKNBmLu28Wz0fE",
  authDomain: "newbank-bd93f.firebaseapp.com",
  databaseURL: "https://newbank-bd93f-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "newbank-bd93f",
  storageBucket: "newbank-bd93f.firebasestorage.app",
  messagingSenderId: "309288106413",
  appId: "1:309288106413:web:1c238c82e611e4d8e48924"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the database service
export const database = getDatabase(app);

export default app;