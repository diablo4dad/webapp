import type { ReactNode } from "react";
import Account, { Direction } from "../../auth/Account";
import type { DadUser } from "../../auth/type";
import Authenticate, { Orientation } from "../../auth/Authenticate";
import type { SidebarVisibility } from "../../common";
import Button, { BtnColours } from "../../components/Button";
import {
  Close,
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
import CollectionEditor from "../../editor/CollectionEditor";
import CollectionItemEditor from "../../editor/CollectionItemEditor";
import i18n from "../../i18n";
import logo from "../../image/d4dad-badge@1x.png";
import ConfigSidebar from "../../settings/ConfigSidebar";
import styles from "./route.module.css";
import {
  RootHeaderLayout,
  RootLayout,
  RootMobileDrawerLayout,
  RootMobileSearchOverlayLayout,
} from "./layout";
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

type RootAuthActionsProps = {
  onSignIn: () => void;
  onSignOut: () => void;
  user?: DadUser;
};

type RootMainProps = {
  canEditCatalog: boolean;
  isEditMode: boolean;
  isMobileConfigOpen: boolean;
  isMobileSearchOpen: boolean;
  onClearSearch: () => void;
  onCloseMobileContent: () => void;
  onSearchChange: (value: string) => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleEditMode: () => void;
  routeOutlet: ReactNode;
  searchTerm: string;
  user?: DadUser;
};

type MobileSearchOverlayProps = {
  onClearSearch: () => void;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  searchTerm: string;
};

type MobileSettingsDrawerProps = {
  canEditCatalog: boolean;
  isEditMode: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleEditMode: () => void;
  user?: DadUser;
};

type MobileEditorControlProps = {
  isEditMode: boolean;
  onToggleEditMode: () => void;
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
          aria-label={ariaLabel}
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

function RootAuthActions({
  onSignIn,
  onSignOut,
  user,
}: RootAuthActionsProps) {
  if (user === undefined) {
    return <Authenticate orientation={Orientation.ROW} onAuth={onSignIn} />;
  }

  return (
    <Account
      currentUser={user}
      onLogout={onSignOut}
      direction={Direction.ROW}
    />
  );
}

function RootMain({
  canEditCatalog,
  isEditMode,
  isMobileConfigOpen,
  isMobileSearchOpen,
  onClearSearch,
  onCloseMobileContent,
  onSearchChange,
  onSignIn,
  onSignOut,
  onToggleEditMode,
  routeOutlet,
  searchTerm,
  user,
}: RootMainProps) {
  return (
    <>
      {routeOutlet}
      <CollectionEditor />
      <CollectionItemEditor />
      {isMobileSearchOpen && (
        <MobileSearchOverlay
          onClearSearch={onClearSearch}
          onClose={onCloseMobileContent}
          onSearchChange={onSearchChange}
          searchTerm={searchTerm}
        />
      )}
      {isMobileConfigOpen && (
        <MobileSettingsDrawer
          canEditCatalog={canEditCatalog}
          isEditMode={isEditMode}
          onClose={onCloseMobileContent}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          onToggleEditMode={onToggleEditMode}
          user={user}
        />
      )}
    </>
  );
}

function MobileSearchOverlay({
  onClearSearch,
  onClose,
  onSearchChange,
  searchTerm,
}: MobileSearchOverlayProps) {
  return (
    <RootMobileSearchOverlayLayout
      onClose={onClose}
      header={
        <>
          <div className={styles.MobileSearchTitle}>Transmog Search</div>
          <button
            className={styles.MobileOverlayClose}
            onClick={onClose}
            aria-label="Close search"
          >
            <Close />
          </button>
        </>
      }
      body={
        <div className={styles.MobileSearchField}>
          <Search
            value={searchTerm}
            onChange={onSearchChange}
            onClear={onClearSearch}
            autoFocus={true}
            placeholder={"Search transmogs"}
          />
        </div>
      }
      actions={
        <>
          <Button
            className={styles.MobileSearchActionPrimary}
            colour={BtnColours.Dark}
            onClick={onClose}
          >
            Search
          </Button>
          <Button
            className={styles.MobileSearchAction}
            colour={BtnColours.Dark}
            onClick={onClearSearch}
          >
            Clear
          </Button>
        </>
      }
    />
  );
}

function MobileSettingsDrawer({
  canEditCatalog,
  isEditMode,
  onClose,
  onSignIn,
  onSignOut,
  onToggleEditMode,
  user,
}: MobileSettingsDrawerProps) {
  return (
    <RootMobileDrawerLayout
      onClose={onClose}
      header={
        <>
          <div className={styles.MobileDrawerTitle}>Settings</div>
          <button
            className={styles.MobileOverlayClose}
            onClick={onClose}
            aria-label="Close settings"
          >
            <Close />
          </button>
        </>
      }
      body={
        <>
          {canEditCatalog && (
            <MobileEditorControl
              isEditMode={isEditMode}
              onToggleEditMode={onToggleEditMode}
            />
          )}
          <ConfigSidebar />
        </>
      }
      footer={
        <RootAuthActions
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          user={user}
        />
      }
    />
  );
}

function MobileEditorControl({
  isEditMode,
  onToggleEditMode,
}: MobileEditorControlProps) {
  return (
    <div className={styles.MobileEditorSection}>
      <div className={styles.MobileEditorMeta}>
        <div className={styles.MobileEditorTitle}>Editor Mode</div>
      </div>
      <button
        className={
          isEditMode
            ? styles.MobileEditorToggleActive
            : styles.MobileEditorToggle
        }
        onClick={onToggleEditMode}
        type="button"
        aria-pressed={isEditMode}
      >
        <span className={styles.MobileEditorToggleIcon}>
          <Pencil />
        </span>
        <span>{isEditMode ? "On" : "Off"}</span>
      </button>
    </div>
  );
}

export { RootView };
