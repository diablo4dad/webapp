import type { DadUser } from "../../auth/type";
import type { SidebarVisibility } from "../../common";
import Search from "../../components/Search";
import { RootAuthActions } from "./auth";
import { RootHeaderActions } from "./header-actions";
import {
  RootHeaderLogo,
  RootHeaderTitle,
} from "./header-brand";
import { RootHeaderLayout } from "./header-layout";

type RootHeaderProps = {
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

function RootHeader({
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
}: RootHeaderProps) {
  return (
    <RootHeaderLayout
      logo={<RootHeaderLogo />}
      title={<RootHeaderTitle />}
      search={
        <Search
          value={searchTerm}
          onChange={onSearchChange}
          onClear={onClearSearch}
          placeholder={"Search transmogs"}
        />
      }
      actions={
        <RootHeaderActions
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
        <RootAuthActions
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          user={user}
        />
      }
    />
  );
}

export { RootHeader };
