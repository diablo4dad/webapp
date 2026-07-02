import type { DadUser } from "../../auth/type";
import { Close, Pencil } from "../../components/Icons";
import ConfigSidebar from "../../settings/ConfigSidebar";
import { RootAuthActions } from "./auth";
import { RootMobileDrawerLayout } from "./mobile-layout";
import styles from "./mobile.module.css";

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

export { MobileSettingsDrawer };
