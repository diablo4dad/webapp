import { ReactElement, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import { useAuth } from "../../auth/context";
import { useData } from "../../data/context";
import placeholder from "../../image/placeholder.webp";
import { useEditor } from "../../editor/context";
import {
  Content,
  closeContent,
  getInitialContentState,
  toggleContent,
  toggleSidebarVisibility,
} from "./state";
import { View } from "./view";

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

  const [contentState, setContentState] = useState(getInitialContentState);
  const content = contentState.content;

  function onToggleItemSidebar() {
    setSidebarVisibility(
      toggleSidebarVisibility(sidebarVisibility, "showItem"),
    );
  }

  function onToggleConfig() {
    setSidebarVisibility(
      toggleSidebarVisibility(sidebarVisibility, "showConfig"),
    );
  }

  function onClearSearch() {
    setSearchTerm("");
  }

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

  return (
    <View
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
