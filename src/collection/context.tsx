import {
  createContext,
  Dispatch,
  PropsWithChildren,
  useContext,
  useEffect,
  useReducer,
  useRef,
} from "react";

import { CollectionLog } from "./type";
import { toggleValueInArray } from "../common/arrays";
import { hashCode } from "../common/hash";
import { VersionInfo } from "../store";
import { runCollectionLogMigrations } from "../migrations";

export const defaultCollection: CollectionLog = {
  collected: [],
  hidden: [],
};

const defaultDispatch = () => defaultCollection;

export enum CollectionActionType {
  COLLECT = "collect",
  HIDE = "hide",
  RELOAD = "reload",
}

export type ReloadCollectionAction = {
  type: CollectionActionType.RELOAD;
  collection: CollectionLog;
  version: VersionInfo;
};

export type ToggleCollectionAction = {
  type: CollectionActionType.COLLECT | CollectionActionType.HIDE;
  itemId: number[];
  toggle: boolean;
};

export type CollectionAction = ReloadCollectionAction | ToggleCollectionAction;

type Props = PropsWithChildren & {
  collection?: CollectionLog;
};

export const CollectionContext =
  createContext<CollectionLog>(defaultCollection);
export const CollectionDispatchContext =
  createContext<Dispatch<CollectionAction>>(defaultDispatch);

export function CollectionProvider({ children, collection }: Props) {
  const loaded = useRef(false);
  const [value, dispatch] = useReducer(
    collectionReducer,
    collection ?? defaultCollection,
  );

  return (
    <CollectionContext.Provider value={value}>
      <CollectionDispatchContext.Provider value={dispatch}>
        {children}
      </CollectionDispatchContext.Provider>
    </CollectionContext.Provider>
  );
}

export function useCollection() {
  return useContext(CollectionContext);
}

export function useCollectionDispatch() {
  return useContext(CollectionDispatchContext);
}

function collectionReducer(
  collectionLog: CollectionLog,
  action: CollectionAction,
): CollectionLog {
  switch (action.type) {
    // usually used when syncing from firestore
    case CollectionActionType.RELOAD:
      return runCollectionLogMigrations(action.collection, action.version);

    // ui interactions
    case CollectionActionType.COLLECT:
      return {
        ...collectionLog,
        collected: toggleValueInArray(
          collectionLog.collected,
          hashCode(action.itemId),
          action.toggle,
        ),
      };

    case CollectionActionType.HIDE:
      return {
        ...collectionLog,
        hidden: toggleValueInArray(
          collectionLog.hidden,
          hashCode(action.itemId),
          action.toggle,
        ),
      };

    default:
      return collectionLog;
  }
}
