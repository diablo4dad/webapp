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
import styles from "./mobile.module.css";

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
          <div className={styles.MobileSearchOverlayTitle}>
            Transmog Search
          </div>
          <button
            className={styles.MobileSearchOverlayClose}
            onClick={onClose}
            aria-label="Close search"
          >
            <Close />
          </button>
        </>
      }
      body={
        <div className={styles.MobileSearchOverlayField}>
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
            className={styles.MobileSearchOverlayActionPrimary}
            colour={BtnColours.Dark}
            onClick={onClose}
          >
            Search
          </Button>
          <Button
            className={styles.MobileSearchOverlayAction}
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
          <div className={styles.MobileSettingsDrawerTitle}>Settings</div>
          <button
            className={styles.MobileSettingsDrawerClose}
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
    <div className={styles.MobileEditorControl}>
      <div className={styles.MobileEditorControlMeta}>
        <div className={styles.MobileEditorControlTitle}>Editor Mode</div>
      </div>
      <button
        className={
          isEditMode
            ? styles.MobileEditorControlToggleActive
            : styles.MobileEditorControlToggle
        }
        onClick={onToggleEditMode}
        type="button"
        aria-pressed={isEditMode}
      >
        <span className={styles.MobileEditorControlToggleIcon}>
          <Pencil />
        </span>
        <span>{isEditMode ? "On" : "Off"}</span>
      </button>
    </div>
  );
}

export { MobileSearchOverlay, MobileSettingsDrawer };
