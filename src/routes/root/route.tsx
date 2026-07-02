import { ReactElement, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { useAuth } from "../../auth/context";
import { useData, type DataContextType } from "../../data/context";
import placeholder from "../../image/placeholder.webp";
import { useEditor } from "../../editor/context";
import { toggleSidebarVisibility } from "./state";
import { View } from "./view";

type MobileConfigControls = {
  isMobileConfigOpen: boolean;
  onCloseMobileContent: () => void;
  onToggleMobileConfig: () => void;
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
    onCloseMobileContent,
    onToggleMobileConfig,
  } = useMobileConfigControls();
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
      isMobileSearchOpen={false}
      onClearSearch={onClearSearch}
      onCloseMobileContent={onCloseMobileContent}
      onSearchChange={setSearchTerm}
      onSignIn={signIn}
      onSignOut={signOut}
      onToggleConfig={onToggleConfig}
      onToggleEditMode={toggleEditMode}
      onToggleItemSidebar={onToggleItemSidebar}
      onToggleMobileConfig={onToggleMobileConfig}
      routeOutlet={<Outlet />}
      searchTerm={searchTerm}
      sidebarVisibility={sidebarVisibility}
      user={user}
    />
  );
}

function useMobileConfigControls(): MobileConfigControls {
  const [isMobileConfigOpen, setIsMobileConfigOpen] = useState(false);

  function onCloseMobileContent() {
    setIsMobileConfigOpen(false);
  }

  function onToggleMobileConfig() {
    setIsMobileConfigOpen((currentIsMobileConfigOpen) =>
      !currentIsMobileConfigOpen,
    );
  }

  return {
    isMobileConfigOpen,
    onCloseMobileContent,
    onToggleMobileConfig,
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
