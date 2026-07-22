import type { ReactNode } from "react";
import type { DadUser } from "../../services/auth";
import type { MasterGroup, SidebarVisibility } from "../../shared/domain";
import { Footer } from "./footer";
import { Header } from "./header";
import { Layout } from "./layout";
import { Main } from "./main";

type Props = {
  canEditCatalog: boolean;
  isContentConstrained: boolean;
  isEditMode: boolean;
  isFooterVisible: boolean;
  isMobileConfigOpen: boolean;
  isMobileMenuOpen: boolean;
  isMobileSearchOpen: boolean;
  onClearSearch: () => void;
  onCloseMobileContent: () => void;
  onSearchChange: (value: string) => void;
  onSelectCollectionGroup: (group: MasterGroup) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleConfig: () => void;
  onToggleEditMode: () => void;
  onToggleItemSidebar: () => void;
  onToggleMobileConfig: () => void;
  onToggleMobileMenu: () => void;
  onToggleMobileSearch: () => void;
  routeOutlet: ReactNode;
  searchPlaceholder: string;
  searchTerm: string;
  searchTitle: string;
  sidebarVisibility: SidebarVisibility;
  showCollectionControls: boolean;
  user?: DadUser;
};

function View({
  canEditCatalog,
  isContentConstrained,
  isEditMode,
  isFooterVisible,
  isMobileConfigOpen,
  isMobileMenuOpen,
  isMobileSearchOpen,
  onClearSearch,
  onCloseMobileContent,
  onSearchChange,
  onSelectCollectionGroup,
  onSignIn,
  onSignOut,
  onToggleConfig,
  onToggleEditMode,
  onToggleItemSidebar,
  onToggleMobileConfig,
  onToggleMobileMenu,
  onToggleMobileSearch,
  routeOutlet,
  searchPlaceholder,
  searchTerm,
  searchTitle,
  sidebarVisibility,
  showCollectionControls,
  user,
}: Props) {
  return (
    <Layout
      isFooterVisible={isFooterVisible}
      isContentConstrained={isContentConstrained}
      header={
        <Header
          canEditCatalog={canEditCatalog}
          isMobileConfigOpen={isMobileConfigOpen}
          isMobileMenuOpen={isMobileMenuOpen}
          isMobileSearchOpen={isMobileSearchOpen}
          isEditMode={isEditMode}
          onClearSearch={onClearSearch}
          onSearchChange={onSearchChange}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          onToggleConfig={onToggleConfig}
          onToggleEditMode={onToggleEditMode}
          onToggleItemSidebar={onToggleItemSidebar}
          onToggleMobileConfig={onToggleMobileConfig}
          onToggleMobileMenu={onToggleMobileMenu}
          onToggleMobileSearch={onToggleMobileSearch}
          searchPlaceholder={searchPlaceholder}
          searchTerm={searchTerm}
          sidebarVisibility={sidebarVisibility}
          showCollectionControls={showCollectionControls}
          user={user}
        />
      }
      main={
        <Main
          canEditCatalog={canEditCatalog}
          isEditMode={isEditMode}
          isMobileConfigOpen={isMobileConfigOpen}
          isMobileMenuOpen={isMobileMenuOpen}
          isMobileSearchOpen={isMobileSearchOpen}
          onClearSearch={onClearSearch}
          onCloseMobileContent={onCloseMobileContent}
          onSearchChange={onSearchChange}
          onSelectCollectionGroup={onSelectCollectionGroup}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          onToggleEditMode={onToggleEditMode}
          routeOutlet={routeOutlet}
          searchPlaceholder={searchPlaceholder}
          searchTerm={searchTerm}
          searchTitle={searchTitle}
          showCollectionControls={showCollectionControls}
          user={user}
        />
      }
      footer={<Footer />}
    />
  );
}

export { View };
