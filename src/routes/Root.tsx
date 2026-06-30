import { ReactElement, useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";

import { useAuth } from "../auth/context";
import { ContentType } from "../common";
import { useData } from "../data/context";
import placeholder from "../image/placeholder.webp";
import { useEditor } from "../editor/context";
import { RootView } from "./root/view";

function Root(): ReactElement {
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

  const [content, setContent] = useState(ContentType.LEDGER);
  const history = useRef([ContentType.LEDGER]);

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
    setContent(popHistory());
  }

  function onToggleMobileConfig() {
    setContent(
      content === ContentType.CONFIG
        ? popHistory()
        : pushHistory(ContentType.CONFIG),
    );
  }

  function pushHistory(content: ContentType) {
    if ([ContentType.CONFIG, ContentType.SEARCH].includes(content)) {
      return content;
    }
    if (
      history.current.length &&
      history.current[history.current.length - 1] === content
    ) {
      return content;
    }

    history.current.push(content);

    return content;
  }

  function popHistory(): ContentType {
    return history.current.pop() ?? ContentType.LEDGER;
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

export default Root;
