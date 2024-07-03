import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "../config/firebase";
import { runFirestoreMigrations, runStoreMigrations } from "../migrations";
import { FirebaseData, initStore } from "./index";
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
  const firestoreDataSanitised = runFirestoreMigrations(firestoreData);
  const storeDataPatched = await runStoreMigrations({
    ...initStore(), // mixin legacy
    ...firestoreDataSanitised,
  });

  return {
    version: storeDataPatched.version,
    collectionLog: storeDataPatched.collectionLog,
  };
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
