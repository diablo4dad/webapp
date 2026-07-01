import type { DadUser } from "../../auth/type";
import Button, { BtnColours } from "../../components/Button";
import { Close, Pencil } from "../../components/Icons";
import Search from "../../components/Search";
import ConfigSidebar from "../../settings/ConfigSidebar";
import { RootAuthActions } from "./auth";
import {
  RootMobileDrawerLayout,
  RootMobileSearchOverlayLayout,
} from "./layout";
import styles from "./route.module.css";

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

export { MobileSearchOverlay, MobileSettingsDrawer };
