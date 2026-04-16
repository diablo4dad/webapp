import {
  createContext,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";
import { getDefaultItemId } from "./getters";
import { CollectionGroup, DadDb } from "./index";
import { useCollection } from "../collection/context";
import { useSettings } from "../settings/context";
import { filterDb } from "./filters";
import {
  DEFAULT_SIDEBAR_VISIBILITY,
  MasterGroup,
  SidebarVisibility,
} from "../common";
import { useDebounceValue } from "usehooks-ts";

const defaultDadDb: DadDb = {
  collections: [],
  items: [],
  itemTypes: [],
};

const defaultContext: DataContextType = {
  db: defaultDadDb,
  group: MasterGroup.UNIVERSAL,
  sidebarVisibility: DEFAULT_SIDEBAR_VISIBILITY,
  setSidebarVisibility: () => undefined,
  setDb: () => undefined,
  switchDb: () => undefined,
  filteredDb: [],
  countedDb: [],
  searchTerm: "",
  setSearchTerm: () => undefined,
  focusItemId: -1,
  setFocusItemId: () => undefined,
};

export type DataContextType = {
  db: DadDb;
  group: MasterGroup;
  sidebarVisibility: SidebarVisibility;
  setSidebarVisibility: (sidebarVisibility: SidebarVisibility) => void;
  setDb: (dadDb: DadDb) => void;
  switchDb: (group: MasterGroup) => void;
  countedDb: CollectionGroup;
  filteredDb: CollectionGroup;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  focusItemId: number;
  setFocusItemId: (itemId: number) => void;
};

export const DataContext = createContext<DataContextType>(defaultContext);

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }: PropsWithChildren) {
  const log = useCollection();
  const settings = useSettings();

  const [db, setDb] = useState<DadDb>(defaultDadDb);
  const [group, switchDb] = useState<MasterGroup>(MasterGroup.UNIVERSAL);
  const [sidebarVisibility, setSidebarVisibility] = useState<SidebarVisibility>(
    DEFAULT_SIDEBAR_VISIBILITY,
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 300);
  const [focusItemId, setFocusItemId] = useState(-1);
  const filteredDb = useMemo(() => {
    const filteredDb = filterDb(
      db.collections,
      settings,
      log,
      group,
      debouncedSearchTerm,
      false,
    );

    if (focusItemId === -1) {
      setFocusItemId(getDefaultItemId(filteredDb));
    }

    return filteredDb;
  }, [db, settings, log, group, debouncedSearchTerm]);
  const countedDb = useMemo(
    () => filterDb(db.collections, settings, log, group, null, true),
    [db, settings, log, group],
  );

  const contextValue = useMemo(
    () => ({
      db,
      group,
      sidebarVisibility,
      setSidebarVisibility,
      setDb,
      switchDb,
      filteredDb,
      countedDb,
      searchTerm,
      setSearchTerm,
      focusItemId,
      setFocusItemId,
    }),
    [
      db,
      filteredDb,
      sidebarVisibility,
      countedDb,
      group,
      searchTerm,
      focusItemId,
    ],
  );

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
}
