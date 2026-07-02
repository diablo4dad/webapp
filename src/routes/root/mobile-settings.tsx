import type { DadUser } from "../../auth/type";
import { Close, Pencil } from "../../components/Icons";
import ConfigSidebar from "../../settings/ConfigSidebar";
import { AuthActions } from "./auth";
import { MobileDrawerLayout } from "./mobile-layout";
import styles from "./mobile-settings.module.css";

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
    <MobileDrawerLayout
      onClose={onClose}
      header={
        <>
          <div className={styles.MobileSettingsTitle}>Settings</div>
          <button
            className={styles.MobileSettingsClose}
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
        <AuthActions
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
    <div className={styles.MobileSettingsEditor}>
      <div className={styles.MobileSettingsEditorMeta}>
        <div className={styles.MobileSettingsEditorTitle}>Editor Mode</div>
      </div>
      <button
        className={
          isEditMode
            ? styles.MobileSettingsEditorToggleActive
            : styles.MobileSettingsEditorToggle
        }
        onClick={onToggleEditMode}
        type="button"
        aria-pressed={isEditMode}
      >
        <span className={styles.MobileSettingsEditorToggleIcon}>
          <Pencil />
        </span>
        <span>{isEditMode ? "On" : "Off"}</span>
      </button>
    </div>
  );
}

export { MobileSettingsDrawer };
