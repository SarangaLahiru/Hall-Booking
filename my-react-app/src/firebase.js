import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; 

const firebaseConfig = {
  apiKey: "AIzaSyD3DWwGX_tTOG39viRYkzn0gsDvr9KuiNI",
  authDomain: "hall-booking-70873.firebaseapp.com",
  projectId: "hall-booking-70873",
  storageBucket: "hall-booking-70873.appspot.com",
  messagingSenderId: "1064136642889",
  appId: "1:1064136642889:web:031f5201d782bb04c94a98",
  measurementId: "G-ZM8EDY2415"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firestore
const firestore = getFirestore(app);

export { firestore }; // Export Firestore instance