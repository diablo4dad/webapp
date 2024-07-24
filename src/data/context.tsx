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
};

export type DataContextType = {
  db: DadDb;
  group: MasterGroup;
  switchDb: (group: MasterGroup, db: DadDb) => void;
  filteredDb: DadDb;
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
    () => filterDb(db, settings, log),
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
    }),
    [db, switchDb, filteredDb, group],
  );

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
}
