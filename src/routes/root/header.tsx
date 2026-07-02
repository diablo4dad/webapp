import type { DadUser } from "../../auth/type";
import type { SidebarVisibility } from "../../common";
import { AuthActions } from "./auth";
import { HeaderActions } from "./header-actions";
import {
  HeaderLogo,
  HeaderTitle,
} from "./header-brand";
import { HeaderLayout } from "./header-layout";
import { SearchField } from "./search";

type Props = {
  canEditCatalog: boolean;
  isMobileConfigOpen: boolean;
  isEditMode: boolean;
  onClearSearch: () => void;
  onSearchChange: (value: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleConfig: () => void;
  onToggleEditMode: () => void;
  onToggleItemSidebar: () => void;
  onToggleMobileConfig: () => void;
  searchTerm: string;
  sidebarVisibility: SidebarVisibility;
  user?: DadUser;
};

function Header({
  canEditCatalog,
  isMobileConfigOpen,
  isEditMode,
  onClearSearch,
  onSearchChange,
  onSignIn,
  onSignOut,
  onToggleConfig,
  onToggleEditMode,
  onToggleItemSidebar,
  onToggleMobileConfig,
  searchTerm,
  sidebarVisibility,
  user,
}: Props) {
  return (
    <HeaderLayout
      logo={<HeaderLogo />}
      title={<HeaderTitle />}
      search={
        <SearchField
          value={searchTerm}
          onChange={onSearchChange}
          onClear={onClearSearch}
        />
      }
      actions={
        <HeaderActions
          canEditCatalog={canEditCatalog}
          isEditMode={isEditMode}
          isMobileConfigOpen={isMobileConfigOpen}
          onToggleConfig={onToggleConfig}
          onToggleEditMode={onToggleEditMode}
          onToggleItemSidebar={onToggleItemSidebar}
          onToggleMobileConfig={onToggleMobileConfig}
          sidebarVisibility={sidebarVisibility}
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
