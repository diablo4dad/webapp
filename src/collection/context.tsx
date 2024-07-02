import {
  createContext,
  Dispatch,
  PropsWithChildren,
  useContext,
  useReducer,
} from "react";

import { CollectionLog } from "./type";
import { toggleValueInArray } from "../common/arrays";

export const defaultCollection: CollectionLog = {
  collected: [],
  hidden: [],
};

const defaultDispatch = () => defaultCollection;

export enum CollectionActionType {
  COLLECT = "collect",
  HIDE = "hide",
}

export type CollectionAction = {
  type: CollectionActionType;
  itemId: number;
  toggle: boolean;
};

type Props = PropsWithChildren & {
  collection?: CollectionLog;
};

export const CollectionContext =
  createContext<CollectionLog>(defaultCollection);
export const CollectionDispatchContext =
  createContext<Dispatch<CollectionAction>>(defaultDispatch);

export function CollectionProvider({ children, collection }: Props) {
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
    case CollectionActionType.COLLECT:
      return {
        ...collectionLog,
        collected: toggleValueInArray(
          collectionLog.collected,
          action.itemId,
          action.toggle,
        ),
      };
    case CollectionActionType.HIDE:
      return {
        ...collectionLog,
        hidden: toggleValueInArray(
          collectionLog.hidden,
          action.itemId,
          action.toggle,
        ),
      };
  }
}