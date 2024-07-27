import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { DadDb } from "./index";
import { useCollection } from "../collection/context";
import { useSettings } from "../settings/context";
import { filterDb } from "./filters";
import { MasterGroup } from "../common";

const defaultDadDb: DadDb = {
  collections: [],
};

const defaultContext: DataContextType = {
  db: defaultDadDb,
  group: MasterGroup.GENERAL,
  switchDb: () => undefined,
  filteredDb: defaultDadDb,
  countedDb: defaultDadDb,
};

export type DataContextType = {
  db: DadDb;
  group: MasterGroup;
  switchDb: (group: MasterGroup, db: DadDb) => void;
  filteredDb: DadDb;
  countedDb: DadDb;
};

export const DataContext = createContext<DataContextType>(defaultContext);

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }: PropsWithChildren) {
  const log = useCollection();
  const settings = useSettings();

  const [db, setDb] = useState<DadDb>(defaultDadDb);
  const [group, setGroup] = useState<MasterGroup>(MasterGroup.GENERAL);
  const filteredDb = useMemo(
    () => filterDb(db, settings, log, false),
    [db, settings, log],
  );
  const countedDb = useMemo(
    () => filterDb(db, settings, log, true),
    [db, settings, log],
  );
  const switchDb = useCallback(
    (group: MasterGroup, db: DadDb) => {
      setGroup(group);
      setDb(db);
    },
    [setGroup, setDb],
  );

  const contextValue = useMemo(
    () => ({
      db,
      group,
      switchDb,
      filteredDb,
      countedDb,
    }),
    [db, switchDb, filteredDb, countedDb, group],
  );

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
}
