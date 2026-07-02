import type { DadUser } from "../../auth/type";
import { Close, Pencil } from "../../components/Icons";
import ConfigSidebar from "../../settings/ConfigSidebar";
import { AuthActions } from "./auth";
import { MobileSettingsLayout } from "./mobile-settings-layout";
import styles from "./mobile-settings.module.css";

type Props = {
  canEditCatalog: boolean;
  isEditMode: boolean;
  onClose: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  onToggleEditMode: () => void;
  user?: DadUser;
};

type HeaderProps = {
  onClose: () => void;
};

type BodyProps = {
  canEditCatalog: boolean;
  isEditMode: boolean;
  onToggleEditMode: () => void;
};

type FooterProps = {
  onSignIn: () => void;
  onSignOut: () => void;
  user?: DadUser;
};

type EditorControlProps = {
  isEditMode: boolean;
  onToggleEditMode: () => void;
};

function MobileSettings({
  canEditCatalog,
  isEditMode,
  onClose,
  onSignIn,
  onSignOut,
  onToggleEditMode,
  user,
}: Props) {
  return (
    <MobileSettingsLayout
      onClose={onClose}
      header={
        <Header onClose={onClose} />
      }
      body={
        <Body
          canEditCatalog={canEditCatalog}
          isEditMode={isEditMode}
          onToggleEditMode={onToggleEditMode}
        />
      }
      footer={
        <Footer
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          user={user}
        />
      }
    />
  );
}

function Header({ onClose }: HeaderProps) {
  return (
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
  );
}

function Body({
  canEditCatalog,
  isEditMode,
  onToggleEditMode,
}: BodyProps) {
  return (
    <>
      {canEditCatalog && (
        <MobileEditorControl
          isEditMode={isEditMode}
          onToggleEditMode={onToggleEditMode}
        />
      )}
      <ConfigSidebar />
    </>
  );
}

function Footer({
  onSignIn,
  onSignOut,
  user,
}: FooterProps) {
  return (
    <AuthActions
      onSignIn={onSignIn}
      onSignOut={onSignOut}
      user={user}
    />
  );
}

function MobileEditorControl({
  isEditMode,
  onToggleEditMode,
}: EditorControlProps) {
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

export { MobileSettings };
