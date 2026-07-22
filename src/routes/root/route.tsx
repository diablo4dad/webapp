import { ReactElement, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../../services/auth";
import type { MasterGroup, SidebarVisibility } from "../../shared/domain";
import placeholder from "../../assets/images/placeholder.webp";
import { useEditor } from "../../features/editor";
import { generateUrl } from "../collection-log/links";
import {
  COLLECTION_SHELL_CONTROLS,
  type RootShellControls,
} from "./outlet";
import { useSidebarVisibility } from "./sidebar";
import { toggleSidebarVisibility } from "./state";
import { View } from "./view";

type MobileContentControls = {
  isMobileConfigOpen: boolean;
  isMobileMenuOpen: boolean;
  isMobileSearchOpen: boolean;
  onCloseMobileContent: () => void;
  onToggleMobileConfig: () => void;
  onToggleMobileMenu: () => void;
  onToggleMobileSearch: () => void;
};

type SidebarControls = {
  onToggleConfig: () => void;
  onToggleItemSidebar: () => void;
};

function RootRoute(): ReactElement {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [shellControls, setRootShellControls] =
    useState<RootShellControls>(COLLECTION_SHELL_CONTROLS);
  const { setSidebarVisibility, sidebarVisibility } = useSidebarVisibility();
  const { user, signIn, signOut } = useAuth();
  const { canEditCatalog, isEditMode, toggleEditMode } = useEditor();

  // preload to prevent jank
  useEffect(() => {
    new Image().src = placeholder;
  }, []);

  const {
    isMobileConfigOpen,
    isMobileMenuOpen,
    isMobileSearchOpen,
    onCloseMobileContent,
    onToggleMobileConfig,
    onToggleMobileMenu,
    onToggleMobileSearch,
  } = useMobileContentControls();
  const {
    onToggleConfig,
    onToggleItemSidebar,
  } = getSidebarControls(sidebarVisibility, setSidebarVisibility);

  function onClearSearch() {
    setSearchTerm("");
  }

  function onSelectCollectionGroup(group: MasterGroup) {
    void navigate(generateUrl(group));
  }

  return (
    <View
      canEditCatalog={canEditCatalog}
      isEditMode={isEditMode}
      isContentConstrained={shellControls.isContentConstrained}
      isFooterVisible={shellControls.isFooterVisible}
      isMobileConfigOpen={isMobileConfigOpen}
      isMobileMenuOpen={isMobileMenuOpen}
      isMobileSearchOpen={isMobileSearchOpen}
      onClearSearch={onClearSearch}
      onCloseMobileContent={onCloseMobileContent}
      onSearchChange={setSearchTerm}
      onSelectCollectionGroup={onSelectCollectionGroup}
      onSignIn={signIn}
      onSignOut={signOut}
      onToggleConfig={onToggleConfig}
      onToggleEditMode={toggleEditMode}
      onToggleItemSidebar={onToggleItemSidebar}
      onToggleMobileConfig={onToggleMobileConfig}
      onToggleMobileMenu={onToggleMobileMenu}
      onToggleMobileSearch={onToggleMobileSearch}
      routeOutlet={
        <Outlet
          context={{
            onClearSearch,
            onSearchChange: setSearchTerm,
            searchTerm,
            setRootShellControls,
            sidebarVisibility,
          }}
        />
      }
      searchPlaceholder={shellControls.searchPlaceholder}
      searchTerm={searchTerm}
      searchTitle={shellControls.searchTitle}
      sidebarVisibility={sidebarVisibility}
      showCollectionControls={shellControls.showCollectionControls}
      user={user}
    />
  );
}

function useMobileContentControls(): MobileContentControls {
  const [isMobileConfigOpen, setIsMobileConfigOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  function onCloseMobileContent() {
    setIsMobileConfigOpen(false);
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
  }

  function onToggleMobileConfig() {
    if (isMobileConfigOpen) {
      setIsMobileConfigOpen(false);
      return;
    }

    setIsMobileSearchOpen(false);
    setIsMobileMenuOpen(false);
    setIsMobileConfigOpen(true);
  }

  function onToggleMobileMenu() {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      return;
    }

    setIsMobileConfigOpen(false);
    setIsMobileSearchOpen(false);
    setIsMobileMenuOpen(true);
  }

  function onToggleMobileSearch() {
    if (isMobileSearchOpen) {
      setIsMobileSearchOpen(false);
      return;
    }

    setIsMobileConfigOpen(false);
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(true);
  }

  return {
    isMobileConfigOpen,
    isMobileMenuOpen,
    isMobileSearchOpen,
    onCloseMobileContent,
    onToggleMobileConfig,
    onToggleMobileMenu,
    onToggleMobileSearch,
  };
}

function getSidebarControls(
  sidebarVisibility: SidebarVisibility,
  setSidebarVisibility: (sidebarVisibility: SidebarVisibility) => void,
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
