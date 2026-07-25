import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  getFirestore,
} from "firebase/firestore";
import {
  connectStorageEmulator,
  getStorage,
} from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import {
  FIREBASE_AUTH_EMULATOR_ORIGIN,
  FIREBASE_EMULATOR_HOST,
  FIREBASE_FIRESTORE_EMULATOR_PORT,
  FIREBASE_STORAGE_EMULATOR_PORT,
  shouldUseFirebaseEmulators,
} from "./firebase-emulators";
import {
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
} from "./index";

const firebaseConfig = {
  apiKey: "AIzaSyDT_Sh2rufVus0ISono5Pb4ZGnU1LDF8CU",
  authDomain: "d4log-bfc60.firebaseapp.com",
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: "37093938675",
  appId: "1:37093938675:web:a529225838441b0780ae86",
  measurementId: "G-DJ7FMXPHKQ",
};

// Instantiate Firebase
const application = initializeApp(firebaseConfig);
const auth = getAuth(application);
const firestore = getFirestore(application);
const storage = getStorage(application);
const analytics = getAnalytics(application);

connectLocalEmulators();

console.log("Firebase initialised.", {
  emulators: shouldUseFirebaseEmulators(),
  name: application.name,
  currentUser: auth.currentUser,
});

function connectLocalEmulators() {
  if (!shouldUseFirebaseEmulators() || isEmulatorConnectionConfigured()) {
    return;
  }

  connectAuthEmulator(auth, FIREBASE_AUTH_EMULATOR_ORIGIN, {
    disableWarnings: true,
  });
  connectFirestoreEmulator(
    firestore,
    FIREBASE_EMULATOR_HOST,
    FIREBASE_FIRESTORE_EMULATOR_PORT,
  );
  connectStorageEmulator(
    storage,
    FIREBASE_EMULATOR_HOST,
    FIREBASE_STORAGE_EMULATOR_PORT,
  );
  markEmulatorConnectionConfigured();
}

function isEmulatorConnectionConfigured(): boolean {
  return typeof window !== "undefined" &&
    window.d4logFirebaseEmulatorsConfigured === true;
}

function markEmulatorConnectionConfigured() {
  if (typeof window !== "undefined") {
    window.d4logFirebaseEmulatorsConfigured = true;
  }
}

declare global {
  interface Window {
    d4logFirebaseEmulatorsConfigured?: boolean;
  }
}

export { application, auth, firestore, storage, analytics };
export default application;
