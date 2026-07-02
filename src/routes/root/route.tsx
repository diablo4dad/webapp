import { ReactElement, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { useAuth } from "../../auth/context";
import { useData, type DataContextType } from "../../data/context";
import placeholder from "../../image/placeholder.webp";
import { useEditor } from "../../editor/context";
import { toggleSidebarVisibility } from "./state";
import { View } from "./view";

type MobileContentControls = {
  isMobileConfigOpen: boolean;
  isMobileSearchOpen: boolean;
  onCloseMobileContent: () => void;
  onToggleMobileConfig: () => void;
  onToggleMobileSearch: () => void;
};

type SidebarControls = {
  onToggleConfig: () => void;
  onToggleItemSidebar: () => void;
};

function RootRoute(): ReactElement {
  const {
    searchTerm,
    setSearchTerm,
    setSidebarVisibility,
    sidebarVisibility,
  } = useData();
  const { user, signIn, signOut } = useAuth();
  const { canEditCatalog, isEditMode, toggleEditMode } = useEditor();

  // preload to prevent jank
  useEffect(() => {
    new Image().src = placeholder;
  }, []);

  const {
    isMobileConfigOpen,
    isMobileSearchOpen,
    onCloseMobileContent,
    onToggleMobileConfig,
    onToggleMobileSearch,
  } = useMobileContentControls();
  const {
    onToggleConfig,
    onToggleItemSidebar,
  } = getSidebarControls(sidebarVisibility, setSidebarVisibility);

  function onClearSearch() {
    setSearchTerm("");
  }

  return (
    <View
      canEditCatalog={canEditCatalog}
      isEditMode={isEditMode}
      isMobileConfigOpen={isMobileConfigOpen}
      isMobileSearchOpen={isMobileSearchOpen}
      onClearSearch={onClearSearch}
      onCloseMobileContent={onCloseMobileContent}
      onSearchChange={setSearchTerm}
      onSignIn={signIn}
      onSignOut={signOut}
      onToggleConfig={onToggleConfig}
      onToggleEditMode={toggleEditMode}
      onToggleItemSidebar={onToggleItemSidebar}
      onToggleMobileConfig={onToggleMobileConfig}
      onToggleMobileSearch={onToggleMobileSearch}
      routeOutlet={<Outlet />}
      searchTerm={searchTerm}
      sidebarVisibility={sidebarVisibility}
      user={user}
    />
  );
}

function useMobileContentControls(): MobileContentControls {
  const [isMobileConfigOpen, setIsMobileConfigOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  function onCloseMobileContent() {
    setIsMobileConfigOpen(false);
    setIsMobileSearchOpen(false);
  }

  function onToggleMobileConfig() {
    if (isMobileConfigOpen) {
      setIsMobileConfigOpen(false);
      return;
    }

    setIsMobileSearchOpen(false);
    setIsMobileConfigOpen(true);
  }

  function onToggleMobileSearch() {
    if (isMobileSearchOpen) {
      setIsMobileSearchOpen(false);
      return;
    }

    setIsMobileConfigOpen(false);
    setIsMobileSearchOpen(true);
  }

  return {
    isMobileConfigOpen,
    isMobileSearchOpen,
    onCloseMobileContent,
    onToggleMobileConfig,
    onToggleMobileSearch,
  };
}

function getSidebarControls(
  sidebarVisibility: DataContextType["sidebarVisibility"],
  setSidebarVisibility: DataContextType["setSidebarVisibility"],
): SidebarControls {
  return {
    onToggleConfig: () => {
      setSidebarVisibility(
        toggleSidebarVisibility(sidebarVisibility, "showConfig"),
      );
    },
    onToggleItemSidebar: () => {
      setSidebarVisibility(
        toggleSidebarVisibility(sidebarVisibility, "showItem"),
      );
    },
  };
}

export default RootRoute;
