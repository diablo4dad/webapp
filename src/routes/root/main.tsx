import type { ReactNode } from "react";
import type { DadUser } from "../../services/auth";
import type { MasterGroup } from "../../shared/domain";
import { CollectionEditor, CollectionItemEditor } from "../../features/editor/ui";
import { MobileMenu } from "./mobile-menu";
import { MobileSearch } from "./mobile-search";
import { MobileSettings } from "./mobile-settings";

type Props = {
  canEditCatalog: boolean;
  isEditMode: boolean;
  isMobileConfigOpen: boolean;
  isMobileMenuOpen: boolean;
  isMobileSearchOpen: boolean;
  onClearSearch: () => void;
  onCloseMobileContent: () => void;
  onSearchChange: (value: string) => void;
  onSelectCollectionGroup: (group: MasterGroup) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleEditMode: () => void;
  routeOutlet: ReactNode;
  searchPlaceholder: string;
  searchTerm: string;
  searchTitle: string;
  showCollectionControls: boolean;
  showSearch: boolean;
  user?: DadUser;
};

type MobileContentProps = {
  canEditCatalog: boolean;
  isEditMode: boolean;
  isMobileConfigOpen: boolean;
  isMobileMenuOpen: boolean;
  isMobileSearchOpen: boolean;
  onClearSearch: () => void;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  onSelectCollectionGroup: (group: MasterGroup) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleEditMode: () => void;
  searchPlaceholder: string;
  searchTerm: string;
  searchTitle: string;
  showCollectionControls: boolean;
  showSearch: boolean;
  user?: DadUser;
};

function Main({
  canEditCatalog,
  isEditMode,
  isMobileConfigOpen,
  isMobileMenuOpen,
  isMobileSearchOpen,
  onClearSearch,
  onCloseMobileContent,
  onSearchChange,
  onSelectCollectionGroup,
  onSignIn,
  onSignOut,
  onToggleEditMode,
  routeOutlet,
  searchPlaceholder,
  searchTerm,
  searchTitle,
  showCollectionControls,
  showSearch,
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
        isMobileMenuOpen={isMobileMenuOpen}
        isMobileSearchOpen={isMobileSearchOpen}
        onClearSearch={onClearSearch}
        onClose={onCloseMobileContent}
        onSearchChange={onSearchChange}
        onSelectCollectionGroup={onSelectCollectionGroup}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        onToggleEditMode={onToggleEditMode}
        searchPlaceholder={searchPlaceholder}
        searchTerm={searchTerm}
        searchTitle={searchTitle}
        showCollectionControls={showCollectionControls}
        showSearch={showSearch}
        user={user}
      />
    </>
  );
}

function MobileContent({
  canEditCatalog,
  isEditMode,
  isMobileConfigOpen,
  isMobileMenuOpen,
  isMobileSearchOpen,
  onClearSearch,
  onClose,
  onSearchChange,
  onSelectCollectionGroup,
  onSignIn,
  onSignOut,
  onToggleEditMode,
  searchPlaceholder,
  searchTerm,
  searchTitle,
  showCollectionControls,
  showSearch,
  user,
}: MobileContentProps) {
  return (
    <>
      {isMobileMenuOpen && (
        <MobileMenu
          onClose={onClose}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          user={user}
        />
      )}
      {showSearch && isMobileSearchOpen && (
        <MobileSearch
          onClearSearch={onClearSearch}
          onClose={onClose}
          onSearchChange={onSearchChange}
          placeholder={searchPlaceholder}
          searchTerm={searchTerm}
          title={searchTitle}
        />
      )}
      {showCollectionControls && isMobileConfigOpen && (
        <MobileSettings
          canEditCatalog={canEditCatalog}
          isEditMode={isEditMode}
          onClose={onClose}
          onSelectCollectionGroup={onSelectCollectionGroup}
          onToggleEditMode={onToggleEditMode}
        />
      )}
    </>
  );
}

export { Main };
