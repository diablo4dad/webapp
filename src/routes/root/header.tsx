import type { DadUser } from "../../services/auth";
import type { SidebarVisibility } from "../../shared/domain";
import { AuthActions } from "./auth";
import { HeaderActions } from "./header-actions";
import {
  HeaderLogo,
  HeaderTitle,
} from "./header-brand";
import { HeaderLayout } from "./header-layout";
import { HeaderNavigation } from "./header-navigation";
import { SearchField } from "./search";

type Props = {
  canEditCatalog: boolean;
  isMobileConfigOpen: boolean;
  isMobileMenuOpen: boolean;
  isMobileSearchOpen: boolean;
  isEditMode: boolean;
  onClearSearch: () => void;
  onSearchChange: (value: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleConfig: () => void;
  onToggleEditMode: () => void;
  onToggleItemSidebar: () => void;
  onToggleMobileConfig: () => void;
  onToggleMobileMenu: () => void;
  onToggleMobileSearch: () => void;
  searchPlaceholder: string;
  searchTerm: string;
  sidebarVisibility: SidebarVisibility;
  showCollectionControls: boolean;
  showEditorControl?: boolean;
  showSearch: boolean;
  user?: DadUser;
};

function Header({
  canEditCatalog,
  isMobileConfigOpen,
  isMobileMenuOpen,
  isMobileSearchOpen,
  isEditMode,
  onClearSearch,
  onSearchChange,
  onSignIn,
  onSignOut,
  onToggleConfig,
  onToggleEditMode,
  onToggleItemSidebar,
  onToggleMobileConfig,
  onToggleMobileMenu,
  onToggleMobileSearch,
  searchPlaceholder,
  searchTerm,
  sidebarVisibility,
  showCollectionControls,
  showEditorControl = showCollectionControls,
  showSearch,
  user,
}: Props) {
  return (
    <HeaderLayout
      logo={<HeaderLogo />}
      navigation={<HeaderNavigation />}
      title={<HeaderTitle />}
      search={
        showSearch ? (
          <SearchField
            value={searchTerm}
            onChange={onSearchChange}
            onClear={onClearSearch}
            placeholder={searchPlaceholder}
          />
        ) : undefined
      }
      actions={
        <HeaderActions
          canEditCatalog={canEditCatalog}
          hasSearchFilter={searchTerm.length > 0}
          isEditMode={isEditMode}
          isMobileConfigOpen={isMobileConfigOpen}
          isMobileMenuOpen={isMobileMenuOpen}
          isMobileSearchOpen={isMobileSearchOpen}
          onClearSearch={onClearSearch}
          onToggleConfig={onToggleConfig}
          onToggleEditMode={onToggleEditMode}
          onToggleItemSidebar={onToggleItemSidebar}
          onToggleMobileConfig={onToggleMobileConfig}
          onToggleMobileMenu={onToggleMobileMenu}
          onToggleMobileSearch={onToggleMobileSearch}
          sidebarVisibility={sidebarVisibility}
          showCollectionControls={showCollectionControls}
          showEditorControl={showEditorControl}
          showSearch={showSearch}
        />
      }
      auth={
        <AuthActions
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          user={user}
        />
      }
    />
  );
}

export { Header };
