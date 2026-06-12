import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
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
  DUAL_SIDEBAR_MIN_WIDTH,
  MasterGroup,
  SidebarVisibility,
  constrainSidebarVisibility,
  getSidebarVisibilityPreference,
} from "../common";
import { useDebounceValue } from "usehooks-ts";
import { useEditor } from "../editor/context";

const defaultDadDb: DadDb = {
  collections: [],
  items: [],
  itemTypes: [],
};

const dualSidebarMediaQuery = `(min-width: ${DUAL_SIDEBAR_MIN_WIDTH}px)`;

function canShowDualSidebars(): boolean {
  return (
    typeof window === "undefined" ||
    !window.matchMedia ||
    window.matchMedia(dualSidebarMediaQuery).matches
  );
}

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
  focusCollectionId: -1,
  setFocusCollectionId: () => undefined,
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
  focusCollectionId: number;
  setFocusCollectionId: (collectionId: number) => void;
};

export const DataContext = createContext<DataContextType>(defaultContext);

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }: PropsWithChildren) {
  const log = useCollection();
  const settings = useSettings();
  const { isEditMode } = useEditor();

  const [db, setDb] = useState<DadDb>(defaultDadDb);
  const [group, switchDb] = useState<MasterGroup>(MasterGroup.UNIVERSAL);
  const [sidebarVisibility, setRawSidebarVisibility] =
    useState<SidebarVisibility>(() =>
      constrainSidebarVisibility(
        DEFAULT_SIDEBAR_VISIBILITY,
        canShowDualSidebars(),
      ),
    );
  const setSidebarVisibility = useCallback(
    (nextSidebarVisibility: SidebarVisibility) => {
      setRawSidebarVisibility((currentSidebarVisibility) =>
        constrainSidebarVisibility(
          nextSidebarVisibility,
          canShowDualSidebars(),
          getSidebarVisibilityPreference(
            currentSidebarVisibility,
            nextSidebarVisibility,
          ),
        ),
      );
    },
    [],
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm] = useDebounceValue(searchTerm, 300);
  const [focusItemId, setFocusItemId] = useState(-1);
  const [focusCollectionId, setFocusCollectionId] = useState(-1);
  const filteredDb = useMemo(() => {
    const filteredDb = filterDb(
      db.collections,
      settings,
      log,
      group,
      debouncedSearchTerm,
      false,
      isEditMode,
    );

    if (focusItemId === -1) {
      setFocusItemId(getDefaultItemId(filteredDb));
    }

    return filteredDb;
  }, [db, settings, log, group, debouncedSearchTerm, isEditMode]);
  const countedDb = useMemo(
    () => filterDb(db.collections, settings, log, group, null, true),
    [db, settings, log, group],
  );

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const mediaQueryList = window.matchMedia(dualSidebarMediaQuery);
    const enforceCurrentBreakpoint = (canShowBoth: boolean) => {
      if (!canShowBoth) {
        setRawSidebarVisibility((currentSidebarVisibility) =>
          constrainSidebarVisibility(currentSidebarVisibility, false),
        );
      }
    };
    const onBreakpointChange = (event: MediaQueryListEvent) => {
      enforceCurrentBreakpoint(event.matches);
    };

    enforceCurrentBreakpoint(mediaQueryList.matches);

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener("change", onBreakpointChange);

      return () => {
        mediaQueryList.removeEventListener("change", onBreakpointChange);
      };
    }

    mediaQueryList.addListener(onBreakpointChange);

    return () => {
      mediaQueryList.removeListener(onBreakpointChange);
    };
  }, []);

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
      focusCollectionId,
      setFocusCollectionId,
    }),
    [
      db,
      filteredDb,
      sidebarVisibility,
      setSidebarVisibility,
      countedDb,
      group,
      searchTerm,
      focusItemId,
      focusCollectionId,
    ],
  );

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
}
