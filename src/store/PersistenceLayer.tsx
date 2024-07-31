import { PropsWithChildren, useCallback, useEffect } from "react";
import {
  CollectionActionType,
  useCollection,
  useCollectionDispatch,
} from "../collection/context";
import { saveCollection, saveVersion } from "./local";
import { VERSION } from "../config";
import { DadUser } from "../auth/type";
import { fetchFromFirestore, saveToFirestore } from "./firestore";
import { useAuth } from "../auth/context";

export function PersistenceLayer(props: PropsWithChildren) {
  const { user } = useAuth();
  const collection = useCollection();
  const dispatch = useCollectionDispatch();

  // save to local storage effect
  useEffect(() => {
    console.log("[Local Storage] Saving...");
    saveCollection(collection);
    saveVersion(VERSION);

    function commit() {
      if (user?.uid) {
        console.log("[Firestore] Saving...");
        void saveToFirestore(user.uid, collection);
      }
    }

    const timeoutId = setTimeout(commit, 2500);

    return () => {
      clearTimeout(timeoutId);
    };
  });

  const pullFromFirestore = useCallback(
    async (user: DadUser) => {
      const data = await fetchFromFirestore(user.uid);
      if (data) {
        console.log("[Firestore] Loaded...", data);

        dispatch({
          type: CollectionActionType.RELOAD,
          collection: data.collectionLog,
          version: data.version,
        });
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (user) {
      void pullFromFirestore(user);
    }
  }, [pullFromFirestore, user]);

  return <>{props.children}</>;
}
