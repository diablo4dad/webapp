import type { ReactNode } from "react";
import type { DadUser } from "../../auth/type";
import type { SidebarVisibility } from "../../common";
import { Footer } from "./footer";
import { Header } from "./header";
import { Layout } from "./layout";
import { Main } from "./main";
import {
  Content,
  getMobileContentVisibility,
} from "./state";

type Props = {
  canEditCatalog: boolean;
  content: Content;
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

function View({
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
  const {
    isMobileConfigOpen,
    isMobileSearchOpen,
  } = getMobileContentVisibility(content);

  return (
    <Layout
      header={
        <Header
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
        <Main
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
      footer={<Footer />}
    />
  );
}

export { View };
