import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDT_Sh2rufVus0ISono5Pb4ZGnU1LDF8CU",
  authDomain: "d4log-bfc60.firebaseapp.com",
  projectId: "d4log-bfc60",
  storageBucket: "d4log-bfc60.appspot.com",
  messagingSenderId: "37093938675",
  appId: "1:37093938675:web:a529225838441b0780ae86",
  measurementId: "G-DJ7FMXPHKQ",
};

// Instantiate Firebase
const application = initializeApp(firebaseConfig);
const auth = getAuth(application);
const firestore = getFirestore(application);

console.log("Firebase initialised.", {
  name: application.name,
  currentUser: auth.currentUser,
});

export { application, auth, firestore };
export default application;
