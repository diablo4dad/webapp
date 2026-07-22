import type { MasterGroup } from "../../shared/domain";
import { Close, Pencil } from "../../shared/ui/Icons";
import { ConfigSidebar } from "../../features/settings/ui";
import { MobileSettingsLayout } from "./mobile-settings-layout";
import styles from "./mobile-settings.module.css";

type Props = {
  canEditCatalog: boolean;
  isEditMode: boolean;
  onClose: () => void;
  onSelectCollectionGroup: (group: MasterGroup) => void;
  onToggleEditMode: () => void;
};

type HeaderProps = {
  onClose: () => void;
};

type BodyProps = {
  canEditCatalog: boolean;
  isEditMode: boolean;
  onSelectCollectionGroup: (group: MasterGroup) => void;
  onToggleEditMode: () => void;
};

type EditorControlProps = {
  isEditMode: boolean;
  onToggleEditMode: () => void;
};

function MobileSettings({
  canEditCatalog,
  isEditMode,
  onClose,
  onSelectCollectionGroup,
  onToggleEditMode,
}: Props) {
  return (
    <MobileSettingsLayout
      onClose={onClose}
      header={<Header onClose={onClose} />}
      body={
        <Body
          canEditCatalog={canEditCatalog}
          isEditMode={isEditMode}
          onSelectCollectionGroup={onSelectCollectionGroup}
          onToggleEditMode={onToggleEditMode}
        />
      }
    />
  );
}

function Header({ onClose }: HeaderProps) {
  return (
    <>
      <div className={styles.MobileSettingsTitle}>Collection Settings</div>
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
  onSelectCollectionGroup,
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
      <ConfigSidebar onSelectCollectionGroup={onSelectCollectionGroup} />
    </>
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
