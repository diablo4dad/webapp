import type { ReactNode } from "react";
import type { DadUser } from "../../auth/type";
import CollectionEditor from "../../editor/CollectionEditor";
import CollectionItemEditor from "../../editor/CollectionItemEditor";
import { MobileSearchOverlay } from "./mobile-search";
import { MobileSettingsDrawer } from "./mobile-settings";

type Props = {
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

type MobileContentProps = {
  canEditCatalog: boolean;
  isEditMode: boolean;
  isMobileConfigOpen: boolean;
  isMobileSearchOpen: boolean;
  onClearSearch: () => void;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleEditMode: () => void;
  searchTerm: string;
  user?: DadUser;
};

function Main({
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
}: Props) {
  return (
    <>
      {routeOutlet}
      <CollectionEditor />
      <CollectionItemEditor />
      <MobileContent
        canEditCatalog={canEditCatalog}
        isEditMode={isEditMode}
        isMobileConfigOpen={isMobileConfigOpen}
        isMobileSearchOpen={isMobileSearchOpen}
        onClearSearch={onClearSearch}
        onClose={onCloseMobileContent}
        onSearchChange={onSearchChange}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        onToggleEditMode={onToggleEditMode}
        searchTerm={searchTerm}
        user={user}
      />
    </>
  );
}

function MobileContent({
  canEditCatalog,
  isEditMode,
  isMobileConfigOpen,
  isMobileSearchOpen,
  onClearSearch,
  onClose,
  onSearchChange,
  onSignIn,
  onSignOut,
  onToggleEditMode,
  searchTerm,
  user,
}: MobileContentProps) {
  return (
    <>
      {isMobileSearchOpen && (
        <MobileSearchOverlay
          onClearSearch={onClearSearch}
          onClose={onClose}
          onSearchChange={onSearchChange}
          searchTerm={searchTerm}
        />
      )}
      {isMobileConfigOpen && (
        <MobileSettingsDrawer
          canEditCatalog={canEditCatalog}
          isEditMode={isEditMode}
          onClose={onClose}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          onToggleEditMode={onToggleEditMode}
          user={user}
        />
      )}
    </>
  );
}

export { Main };
