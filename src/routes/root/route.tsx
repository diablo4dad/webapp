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

type ContentControls = {
  content: Content;
  onCloseMobileContent: () => void;
  onToggleMobileConfig: () => void;
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

export default RootRoute;
