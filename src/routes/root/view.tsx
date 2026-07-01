import type { ReactNode } from "react";
import type { DadUser } from "../../auth/type";
import type { SidebarVisibility } from "../../common";
import CollectionEditor from "../../editor/CollectionEditor";
import CollectionItemEditor from "../../editor/CollectionItemEditor";
import { RootHeader } from "./header";
import { RootLayout } from "./layout";
import { MobileSearchOverlay, MobileSettingsDrawer } from "./mobile";
import { RootContent } from "./state";

type Props = {
  canEditCatalog: boolean;
  content: RootContent;
  isEditMode: boolean;
  onClearSearch: () => void;
  onCloseMobileContent: () => void;
  onSearchChange: (value: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleConfig: () => void;
  onToggleEditMode: () => void;
  onToggleItemSidebar: () => void;
  onToggleMobileConfig: () => void;
  routeOutlet: ReactNode;
  searchTerm: string;
  sidebarVisibility: SidebarVisibility;
  user?: DadUser;
};

type RootMainProps = {
  canEditCatalog: boolean;
  isEditMode: boolean;
  isMobileConfigOpen: boolean;
  isMobileSearchOpen: boolean;
  onClearSearch: () => void;
  onCloseMobileContent: () => void;
  onSearchChange: (value: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleEditMode: () => void;
  routeOutlet: ReactNode;
  searchTerm: string;
  user?: DadUser;
};

function RootView({
  canEditCatalog,
  content,
  isEditMode,
  onClearSearch,
  onCloseMobileContent,
  onSearchChange,
  onSignIn,
  onSignOut,
  onToggleConfig,
  onToggleEditMode,
  onToggleItemSidebar,
  onToggleMobileConfig,
  routeOutlet,
  searchTerm,
  sidebarVisibility,
  user,
}: Props) {
  const isMobileConfigOpen = content === RootContent.CONFIG;
  const isMobileSearchOpen = content === RootContent.SEARCH;

  return (
    <RootLayout
      header={
        <RootHeader
          canEditCatalog={canEditCatalog}
          isMobileConfigOpen={isMobileConfigOpen}
          isEditMode={isEditMode}
          onClearSearch={onClearSearch}
          onSearchChange={onSearchChange}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          onToggleConfig={onToggleConfig}
          onToggleEditMode={onToggleEditMode}
          onToggleItemSidebar={onToggleItemSidebar}
          onToggleMobileConfig={onToggleMobileConfig}
          searchTerm={searchTerm}
          sidebarVisibility={sidebarVisibility}
          user={user}
        />
      }
      main={
        <RootMain
          canEditCatalog={canEditCatalog}
          isEditMode={isEditMode}
          isMobileConfigOpen={isMobileConfigOpen}
          isMobileSearchOpen={isMobileSearchOpen}
          onClearSearch={onClearSearch}
          onCloseMobileContent={onCloseMobileContent}
          onSearchChange={onSearchChange}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          onToggleEditMode={onToggleEditMode}
          routeOutlet={routeOutlet}
          searchTerm={searchTerm}
          user={user}
        />
      }
    />
  );
}

function RootMain({
  canEditCatalog,
  isEditMode,
  isMobileConfigOpen,
  isMobileSearchOpen,
  onClearSearch,
  onCloseMobileContent,
  onSearchChange,
  onSignIn,
  onSignOut,
  onToggleEditMode,
  routeOutlet,
  searchTerm,
  user,
}: RootMainProps) {
  return (
    <>
      {routeOutlet}
      <CollectionEditor />
      <CollectionItemEditor />
      {isMobileSearchOpen && (
        <MobileSearchOverlay
          onClearSearch={onClearSearch}
          onClose={onCloseMobileContent}
          onSearchChange={onSearchChange}
          searchTerm={searchTerm}
        />
      )}
      {isMobileConfigOpen && (
        <MobileSettingsDrawer
          canEditCatalog={canEditCatalog}
          isEditMode={isEditMode}
          onClose={onCloseMobileContent}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          onToggleEditMode={onToggleEditMode}
          user={user}
        />
      )}
    </>
  );
}

export { RootView };
