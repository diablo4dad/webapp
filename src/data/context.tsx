import {
  createContext,
  Dispatch,
  PropsWithChildren,
  useContext,
  useReducer,
} from "react";
import { DadDb } from "./index";

enum DataActionType {
  UPDATE = "update",
}

export type DataAction = {
  type: DataActionType;
  data: DadDb;
};

const defaultDadDb: DadDb = {
  collections: [],
};

type Props = PropsWithChildren & {
  data?: DadDb;
};

const defaultDispatch = () => defaultDadDb;

export const DataContext = createContext<DadDb>(defaultDadDb);
export const DataContextDispatcher =
  createContext<Dispatch<DataAction>>(defaultDispatch);

export function useData() {
  return useContext(DataContext);
}

export function useDataDispatch() {
  return useContext(DataContextDispatcher);
}

export function DataProvider({ children, data }: Props) {
  const [value, dispatch] = useReducer(dataReducer, data ?? defaultDadDb);

  return (
    <DataContext.Provider value={value}>
      <DataContextDispatcher.Provider value={dispatch}>
        {children}
      </DataContextDispatcher.Provider>
    </DataContext.Provider>
  );
}

function dataReducer(data: DadDb, action: DataAction) {
  switch (action.type) {
    case DataActionType.UPDATE:
      return action.data;
  }
}
