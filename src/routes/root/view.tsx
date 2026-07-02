import type { ReactNode } from "react";
import type { DadUser } from "../../auth/type";
import type { SidebarVisibility } from "../../common";
import { RootHeader } from "./header";
import { RootLayout } from "./layout";
import { RootMain } from "./main";
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

export { RootView };
