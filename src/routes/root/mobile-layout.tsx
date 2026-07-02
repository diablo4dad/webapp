import type { MouseEvent, ReactNode } from "react";
import styles from "./mobile-layout.module.css";

type SearchOverlayProps = {
  actions: ReactNode;
  body: ReactNode;
  header: ReactNode;
  onClose: () => void;
};

type DrawerProps = {
  body: ReactNode;
  footer: ReactNode;
  header: ReactNode;
  onClose: () => void;
};

function MobileSearchOverlayLayout({
  actions,
  body,
  header,
  onClose,
}: SearchOverlayProps) {
  return (
    <div className={styles.MobileLayoutSearchOverlay} onClick={onClose}>
      <div
        className={styles.MobileLayoutSearchOverlayPanel}
        onClick={stopOverlayPropagation}
      >
        <div className={styles.MobileLayoutSearchOverlayHeader}>
          {header}
        </div>
        <div className={styles.MobileLayoutSearchOverlayBody}>{body}</div>
        <div className={styles.MobileLayoutSearchOverlayActions}>
          {actions}
        </div>
      </div>
    </div>
  );
}

function MobileDrawerLayout({
  body,
  footer,
  header,
  onClose,
}: DrawerProps) {
  return (
    <div className={styles.MobileLayoutDrawer} onClick={onClose}>
      <aside
        className={styles.MobileLayoutDrawerPanel}
        onClick={stopOverlayPropagation}
      >
        <div className={styles.MobileLayoutDrawerHeader}>{header}</div>
        <div className={styles.MobileLayoutDrawerBody}>
          <div className={styles.MobileLayoutDrawerContent}>{body}</div>
          <div className={styles.MobileLayoutDrawerFooter}>{footer}</div>
        </div>
      </aside>
    </div>
  );
}

function stopOverlayPropagation(event: MouseEvent) {
  event.stopPropagation();
}

export {
  MobileDrawerLayout,
  MobileSearchOverlayLayout,
};
