import { ReactElement, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { useAuth } from "../../auth/context";
import { useData, type DataContextType } from "../../data/context";
import placeholder from "../../image/placeholder.webp";
import { useEditor } from "../../editor/context";
import {
  Content,
  closeContent,
  getInitialContentState,
  getMobileContentVisibility,
  toggleContent,
  toggleSidebarVisibility,
} from "./state";
import { View } from "./view";

type ContentControls = {
  content: Content;
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
    content,
    onCloseMobileContent,
    onToggleMobileConfig,
  } = useContentControls();
  const {
    isMobileConfigOpen,
    isMobileSearchOpen,
  } = getMobileContentVisibility(content);
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
      routeOutlet={<Outlet />}
      searchTerm={searchTerm}
      sidebarVisibility={sidebarVisibility}
      user={user}
    />
  );
}

function useContentControls(): ContentControls {
  const [contentState, setContentState] = useState(getInitialContentState);

  function onCloseMobileContent() {
    setContentState((currentContentState) =>
      closeContent(currentContentState.history),
    );
  }

  function onToggleMobileConfig() {
    setContentState((currentContentState) =>
      toggleContent(
        currentContentState.content,
        currentContentState.history,
        Content.CONFIG,
      ),
    );
  }

  return {
    content: contentState.content,
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
