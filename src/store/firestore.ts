import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "../config/firebase";
import { runFirestoreMigrations } from "../migrations";
import { FirebaseData } from "./index";
import { CollectionLog } from "../collection/type";
import { VERSION } from "../config";

export async function fetchFromFirestore(
  uid: string,
): Promise<FirebaseData | null> {
  const docRef = doc(firestore, "collections", uid);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    return null;
  }

  const firestoreData = snapshot.data() as FirebaseData;
  return runFirestoreMigrations(firestoreData);
}

export async function saveToFirestore(
  uid: string,
  collectionLog: CollectionLog,
): Promise<void> {
  const docRef = doc(firestore, "collections", uid);
  await setDoc(docRef, {
    collectionLog,
    version: VERSION,
  });
}
