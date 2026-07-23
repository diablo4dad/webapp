import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import type { SidebarVisibility } from "../../shared/domain";

type RootShellControls = {
  isContentConstrained: boolean;
  isFooterVisible: boolean;
  searchPlaceholder: string;
  searchTitle: string;
  showCollectionControls: boolean;
  showSearch: boolean;
};

type RootOutletContext = {
  onClearSearch: () => void;
  onSearchChange: (value: string) => void;
  searchTerm: string;
  setRootShellControls: (controls: RootShellControls) => void;
  sidebarVisibility: SidebarVisibility;
};

const COLLECTION_SHELL_CONTROLS: RootShellControls = {
  isContentConstrained: false,
  isFooterVisible: true,
  searchPlaceholder: "Search transmogs",
  searchTitle: "Transmog Search",
  showCollectionControls: true,
  showSearch: true,
};

const DATABASE_SHELL_CONTROLS: RootShellControls = {
  isContentConstrained: false,
  isFooterVisible: true,
  searchPlaceholder: "Search database",
  searchTitle: "Database Search",
  showCollectionControls: false,
  showSearch: true,
};

const STATS_SHELL_CONTROLS: RootShellControls = {
  isContentConstrained: false,
  isFooterVisible: true,
  searchPlaceholder: "Search transmogs",
  searchTitle: "Stats Search",
  showCollectionControls: false,
  showSearch: false,
};

function useRootOutletContext(): RootOutletContext {
  return useOutletContext<RootOutletContext>();
}

function useRootShellControls(controls: RootShellControls) {
  const { setRootShellControls } = useRootOutletContext();

  useEffect(() => {
    setRootShellControls(controls);

    return () => {
      setRootShellControls(COLLECTION_SHELL_CONTROLS);
    };
  }, [controls, setRootShellControls]);
}

export {
  COLLECTION_SHELL_CONTROLS,
  DATABASE_SHELL_CONTROLS,
  STATS_SHELL_CONTROLS,
  useRootOutletContext,
  useRootShellControls,
};
export type { RootOutletContext, RootShellControls };
