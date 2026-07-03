import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
} from "react";
import { MasterGroup } from "../common";
import { DadDb } from "./index";
import {
  defaultDadDb,
  useCatalogData,
  type CatalogGroupSource,
  type CatalogGroupSources,
} from "./cache";
export type { CatalogGroupSource } from "./cache";

const defaultContext: DataContextType = {
  catalogGroupSources: {},
  db: defaultDadDb,
  group: MasterGroup.UNIVERSAL,
  loadedCatalogGroups: [],
  setCatalogCategoryDb: () => undefined,
  setDb: () => undefined,
  switchDb: () => undefined,
};

export type DataContextType = {
  catalogGroupSources: CatalogGroupSources;
  db: DadDb;
  group: MasterGroup;
  loadedCatalogGroups: MasterGroup[];
  setCatalogCategoryDb: (
    category: MasterGroup,
    dadDb: DadDb,
    source: CatalogGroupSource,
  ) => void;
  setDb: (dadDb: DadDb) => void;
  switchDb: (group: MasterGroup) => void;
};

export const DataContext = createContext<DataContextType>(defaultContext);

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }: PropsWithChildren) {
  const {
    catalogGroupSources,
    db,
    group,
    loadedCatalogGroups,
    setCatalogCategoryDb,
    setDb,
    switchDb,
  } = useCatalogData();

  const contextValue = useMemo(
    () => ({
      catalogGroupSources,
      db,
      group,
      loadedCatalogGroups,
      setCatalogCategoryDb,
      setDb,
      switchDb,
    }),
    [
      catalogGroupSources,
      db,
      loadedCatalogGroups,
      setCatalogCategoryDb,
      setDb,
      group,
      switchDb,
    ],
  );

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
}
