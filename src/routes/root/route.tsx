import { ReactElement, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { useAuth } from "../../auth/context";
import { useData } from "../../data/context";
import placeholder from "../../image/placeholder.webp";
import { useEditor } from "../../editor/context";
import {
  RootContent,
  closeRootContent,
  getInitialRootContentState,
  toggleRootContent,
} from "./state";
import { RootView } from "./view";

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

  const [contentState, setContentState] = useState(getInitialRootContentState);
  const content = contentState.content;

  function onToggleItemSidebar() {
    setSidebarVisibility({
      ...sidebarVisibility,
      showItem: !sidebarVisibility.showItem,
    });
  }

  function onToggleConfig() {
    setSidebarVisibility({
      ...sidebarVisibility,
      showConfig: !sidebarVisibility.showConfig,
    });
  }

  function onClearSearch() {
    setSearchTerm("");
  }

  function onCloseMobileContent() {
    setContentState((currentContentState) =>
      closeRootContent(currentContentState.history),
    );
  }

  function onToggleMobileConfig() {
    setContentState((currentContentState) =>
      toggleRootContent(
        currentContentState.content,
        currentContentState.history,
        RootContent.CONFIG,
      ),
    );
  }

  return (
    <RootView
      canEditCatalog={canEditCatalog}
      content={content}
      isEditMode={isEditMode}
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

export default RootRoute;
