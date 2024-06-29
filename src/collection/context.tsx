import {
  createContext,
  Dispatch,
  PropsWithChildren,
  useContext,
  useReducer,
} from "react";

import { CollectionLog } from "./type";

const initialState: CollectionLog = {
  entries: [],
  collected: [],
  hidden: [],
};

const defaultDispatch = () => initialState;

export enum CollectionActionType {
  COLLECT = "collect",
  HIDE = "hide",
}

export type CollectionAction = {
  type: CollectionActionType;
  itemId: number;
  toggle: boolean;
};

export const CollectionContext = createContext<CollectionLog>(initialState);
export const CollectionDispatchContext =
  createContext<Dispatch<CollectionAction>>(defaultDispatch);

export function CollectionProvider({ children }: PropsWithChildren) {
  const [collection, dispatch] = useReducer(collectionReducer, initialState);

  return (
    <CollectionContext.Provider value={collection}>
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

function toggleValueInArray<T>(array: T[], value: T, toggle: boolean): T[] {
  if (toggle) {
    if (array.includes(value)) {
      return array;
    } else {
      return [...array, value];
    }
  } else {
    if (array.includes(value)) {
      return array.filter((e) => e !== value);
    } else {
      return array;
    }
  }
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
