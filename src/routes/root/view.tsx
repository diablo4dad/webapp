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

export function RootView({
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
  return (
    <RootLayout
      header={
        <RootHeader
          canEditCatalog={canEditCatalog}
          isMobileConfigOpen={content === RootContent.CONFIG}
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
          content={content}
          isEditMode={isEditMode}
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
        <>
          <Tooltip placement={"bottom"}>
            <TooltipTrigger asChild={true}>
              <Button
                onClick={onToggleItemSidebar}
                pressed={sidebarVisibility.showItem}
                showOnly={"desktop"}
                colour={BtnColours.Dark}
              >
                <SidebarLeft />
              </Button>
            </TooltipTrigger>
            <TooltipContent className={styles.HeaderTooltip}>
              {sidebarVisibility.showItem
                ? "Hide Item Sidebar"
                : "Show Item Sidebar"}
            </TooltipContent>
          </Tooltip>
          <Tooltip placement={"bottom"}>
            <TooltipTrigger asChild={true}>
              <Button
                onClick={onToggleConfig}
                pressed={sidebarVisibility.showConfig}
                showOnly={"desktop"}
                colour={BtnColours.Dark}
              >
                <SidebarRight />
              </Button>
            </TooltipTrigger>
            <TooltipContent className={styles.HeaderTooltip}>
              {sidebarVisibility.showConfig
                ? "Hide Settings Sidebar"
                : "Show Settings Sidebar"}
            </TooltipContent>
          </Tooltip>
          {canEditCatalog && (
            <Tooltip placement={"bottom"}>
              <TooltipTrigger asChild={true}>
                <Button
                  onClick={onToggleEditMode}
                  pressed={isEditMode}
                  showOnly={"desktop"}
                  colour={BtnColours.Dark}
                  aria-label={
                    isEditMode ? "Disable editor mode" : "Enable editor mode"
                  }
                >
                  <Pencil />
                </Button>
              </TooltipTrigger>
              <TooltipContent className={styles.HeaderTooltip}>
                {isEditMode ? "Disable Editor Mode" : "Enable Editor Mode"}
              </TooltipContent>
            </Tooltip>
          )}
          <Button
            onClick={onToggleMobileConfig}
            pressed={isMobileConfigOpen}
            showOnly={"mobile"}
          >
            <Hamburger />
          </Button>
        </>
      }
      auth={
        <>
          {user === undefined && (
            <Authenticate orientation={Orientation.ROW} onAuth={onSignIn} />
          )}
          {user !== undefined && (
            <Account
              currentUser={user}
              onLogout={onSignOut}
              direction={Direction.ROW}
            />
          )}
        </>
      }
    />
  );
}

type RootMainProps = {
  canEditCatalog: boolean;
  content: RootContent;
  isEditMode: boolean;
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

function RootMain({
  canEditCatalog,
  content,
  isEditMode,
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
      {content === RootContent.SEARCH && (
        <MobileSearchOverlay
          onClearSearch={onClearSearch}
          onClose={onCloseMobileContent}
          onSearchChange={onSearchChange}
          searchTerm={searchTerm}
        />
      )}
      {content === RootContent.CONFIG && (
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

type MobileSearchOverlayProps = {
  onClearSearch: () => void;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  searchTerm: string;
};

function MobileSearchOverlay({
  onClearSearch,
  onClose,
  onSearchChange,
  searchTerm,
}: MobileSearchOverlayProps) {
  return (
    <RootMobileSearchOverlayLayout onClose={onClose}>
      <div className={styles.MobileSearchHeader}>
        <div className={styles.MobileSearchHeading}>
          <div className={styles.MobileSearchTitle}>Transmog Search</div>
        </div>
        <button
          className={styles.MobileDrawerClose}
          onClick={onClose}
          aria-label="Close search"
        >
          <Close />
        </button>
      </div>
      <div className={styles.MobileSearchBody}>
        <div className={styles.MobileSearchField}>
          <Search
            value={searchTerm}
            onChange={onSearchChange}
            onClear={onClearSearch}
            autoFocus={true}
            placeholder={"Search transmogs"}
          />
        </div>
      </div>
      <div className={styles.MobileSearchActions}>
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
      </div>
    </RootMobileSearchOverlayLayout>
  );
}

type MobileSettingsDrawerProps = {
  canEditCatalog: boolean;
  isEditMode: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleEditMode: () => void;
  user?: DadUser;
};

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
            className={styles.MobileDrawerClose}
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
          )}
          <ConfigSidebar />
        </>
      }
      footer={
        <>
          {user === undefined && (
            <Authenticate orientation={Orientation.ROW} onAuth={onSignIn} />
          )}
          {user !== undefined && (
            <Account
              currentUser={user}
              onLogout={onSignOut}
              direction={Direction.ROW}
            />
          )}
        </>
      }
    />
  );
}
