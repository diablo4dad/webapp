import type { ReactNode } from "react";
import type { DadUser } from "../../auth/type";
import type { SidebarVisibility } from "../../common";
import Button, { BtnColours } from "../../components/Button";
import {
  Hamburger,
  Pencil,
  SidebarLeft,
  SidebarRight,
} from "../../components/Icons";
import Search from "../../components/Search";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../components/Tooltip";
import i18n from "../../i18n";
import logo from "../../image/d4dad-badge@1x.png";
import { RootAuthActions } from "./auth";
import { RootHeaderLayout } from "./layout";
import styles from "./route.module.css";

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

type RootHeaderActionsProps = {
  canEditCatalog: boolean;
  isEditMode: boolean;
  isMobileConfigOpen: boolean;
  onToggleConfig: () => void;
  onToggleEditMode: () => void;
  onToggleItemSidebar: () => void;
  onToggleMobileConfig: () => void;
  sidebarVisibility: SidebarVisibility;
};

type RootHeaderToggleProps = {
  ariaLabel?: string;
  children: ReactNode;
  isPressed: boolean;
  onToggle: () => void;
  tooltip: string;
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
      logo={<img className={styles.HeaderIcon} src={logo} alt={i18n.gameName} />}
      title={
        <div className={styles.HeaderInfo}>
          <div className={styles.HeaderInfoName}>
            <span className={styles.HeaderInfoNameAccent}>Diablo IV</span>{" "}
            <span>Dad</span>
          </div>
          <div className={styles.HeaderInfoTagLine}>{i18n.siteTagLine}</div>
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

function RootHeaderActions({
  canEditCatalog,
  isEditMode,
  isMobileConfigOpen,
  onToggleConfig,
  onToggleEditMode,
  onToggleItemSidebar,
  onToggleMobileConfig,
  sidebarVisibility,
}: RootHeaderActionsProps) {
  return (
    <>
      <RootHeaderToggle
        isPressed={sidebarVisibility.showItem}
        onToggle={onToggleItemSidebar}
        tooltip={
          sidebarVisibility.showItem ? "Hide Item Sidebar" : "Show Item Sidebar"
        }
      >
        <SidebarLeft />
      </RootHeaderToggle>
      <RootHeaderToggle
        isPressed={sidebarVisibility.showConfig}
        onToggle={onToggleConfig}
        tooltip={
          sidebarVisibility.showConfig
            ? "Hide Settings Sidebar"
            : "Show Settings Sidebar"
        }
      >
        <SidebarRight />
      </RootHeaderToggle>
      {canEditCatalog && (
        <RootHeaderToggle
          ariaLabel={isEditMode ? "Disable editor mode" : "Enable editor mode"}
          isPressed={isEditMode}
          onToggle={onToggleEditMode}
          tooltip={isEditMode ? "Disable Editor Mode" : "Enable Editor Mode"}
        >
          <Pencil />
        </RootHeaderToggle>
      )}
      <Button
        aria-label="Settings menu"
        aria-pressed={isMobileConfigOpen}
        onClick={onToggleMobileConfig}
        pressed={isMobileConfigOpen}
        showOnly={"mobile"}
      >
        <Hamburger />
      </Button>
    </>
  );
}

function RootHeaderToggle({
  ariaLabel,
  children,
  isPressed,
  onToggle,
  tooltip,
}: RootHeaderToggleProps) {
  return (
    <Tooltip placement={"bottom"}>
      <TooltipTrigger asChild={true}>
        <Button
          onClick={onToggle}
          pressed={isPressed}
          showOnly={"desktop"}
          colour={BtnColours.Dark}
          aria-label={ariaLabel ?? tooltip}
          aria-pressed={isPressed}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent className={styles.HeaderTooltip}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export { RootHeader };
