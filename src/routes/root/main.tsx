import type { ReactNode } from "react";
import type { DadUser } from "../../services/auth";
import type { MasterGroup } from "../../shared/domain";
import { CollectionEditor, CollectionItemEditor } from "../../editor/ui";
import { MobileSearch } from "./mobile-search";
import { MobileSettings } from "./mobile-settings";

type Props = {
  canEditCatalog: boolean;
  isEditMode: boolean;
  isMobileConfigOpen: boolean;
  isMobileSearchOpen: boolean;
  onClearSearch: () => void;
  onCloseMobileContent: () => void;
  onSearchChange: (value: string) => void;
  onSelectCollectionGroup: (group: MasterGroup) => void;
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
  onSelectCollectionGroup: (group: MasterGroup) => void;
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
  onSelectCollectionGroup,
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
        onSelectCollectionGroup={onSelectCollectionGroup}
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
  onSelectCollectionGroup,
  onSignIn,
  onSignOut,
  onToggleEditMode,
  searchTerm,
  user,
}: MobileContentProps) {
  return (
    <>
      {isMobileSearchOpen && (
        <MobileSearch
          onClearSearch={onClearSearch}
          onClose={onClose}
          onSearchChange={onSearchChange}
          searchTerm={searchTerm}
        />
      )}
      {isMobileConfigOpen && (
        <MobileSettings
          canEditCatalog={canEditCatalog}
          isEditMode={isEditMode}
          onClose={onClose}
          onSelectCollectionGroup={onSelectCollectionGroup}
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
