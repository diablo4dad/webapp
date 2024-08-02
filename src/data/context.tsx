import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";
import { CollectionGroup, DadDb } from "./index";
import { useCollection } from "../collection/context";
import { useSettings } from "../settings/context";
import { filterDb } from "./filters";
import { MasterGroup } from "../common";

const defaultDadDb: DadDb = {
  collections: [],
  items: [],
  itemTypes: [],
};

const defaultContext: DataContextType = {
  db: defaultDadDb,
  group: MasterGroup.GENERAL,
  setDb: () => undefined,
  switchDb: () => undefined,
  filteredDb: [],
  countedDb: [],
};

export type DataContextType = {
  db: DadDb;
  group: MasterGroup;
  setDb: (dadDb: DadDb) => void;
  switchDb: (group: MasterGroup) => void;
  countedDb: CollectionGroup;
  filteredDb: CollectionGroup;
};

export const DataContext = createContext<DataContextType>(defaultContext);

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }: PropsWithChildren) {
  const log = useCollection();
  const settings = useSettings();

  const [db, setDb] = useState<DadDb>(defaultDadDb);
  const [group, switchDb] = useState<MasterGroup>(MasterGroup.GENERAL);
  const filteredDb = useMemo(
    () => filterDb(db.collections, settings, log, group, false),
    [db, settings, log, group],
  );
  const countedDb = useMemo(
    () => filterDb(db.collections, settings, log, group, true),
    [db, settings, log, group],
  );

  const contextValue = useMemo(
    () => ({
      db,
      group,
      setDb,
      switchDb,
      filteredDb,
      countedDb,
    }),
    [db, filteredDb, countedDb, group],
  );

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
}
