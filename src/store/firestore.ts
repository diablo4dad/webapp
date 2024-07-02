import { doc, getDoc, setDoc } from "firebase/firestore";
import { firestore } from "../config/firebase";
import { runFirestoreMigrations, runStoreMigrations } from "./migrations";
import { FirebaseData, StoreData } from "./index";
import { CollectionLog } from "../collection/type";
import { VERSION } from "../config";
import { getStoreData } from "./local";

export async function fetchFromFirestore(
  uid: string,
): Promise<StoreData | null> {
  const docRef = doc(firestore, "collections", uid);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    return null;
  }

  // sync with firestore
  const firestoreData = snapshot.data() as FirebaseData;
  const firestoreDataSanitised = runFirestoreMigrations(firestoreData);

  const localStorageData = getStoreData();
  const localStorageDataMerged = {
    ...localStorageData,
    ...firestoreDataSanitised,
  };

  const storeDataPatched = await runStoreMigrations(localStorageDataMerged);

  console.log("Got Firestore Snapshot...", storeDataPatched);

  return storeDataPatched;
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

  console.log("Firestore write committed.");
}
