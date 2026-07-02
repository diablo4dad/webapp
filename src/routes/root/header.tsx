import type { DadUser } from "../../auth/type";
import type { SidebarVisibility } from "../../common";
import Search from "../../components/Search";
import i18n from "../../i18n";
import logo from "../../image/d4dad-badge@1x.png";
import { RootAuthActions } from "./auth";
import { RootHeaderActions } from "./header-actions";
import styles from "./header.module.css";
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
      logo={
        <img
          className={styles.HeaderLogo}
          src={logo}
          alt={i18n.gameName}
        />
      }
      title={
        <div className={styles.HeaderTitle}>
          <div className={styles.HeaderTitleName}>
            <span className={styles.HeaderTitleNameAccent}>Diablo IV</span>{" "}
            <span>Dad</span>
          </div>
          <div className={styles.HeaderTitleTagLine}>
            {i18n.siteTagLine}
          </div>
        </div>
      }
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
