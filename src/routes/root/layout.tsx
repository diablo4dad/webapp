import type { MouseEvent, ReactNode } from "react";
import { RootFooter } from "./footer";
import styles from "./layout.module.css";

type Props = {
  header: ReactNode;
  main: ReactNode;
};

type MobileSearchProps = {
  actions: ReactNode;
  body: ReactNode;
  header: ReactNode;
  onClose: () => void;
};

type MobileDrawerProps = {
  body: ReactNode;
  footer: ReactNode;
  header: ReactNode;
  onClose: () => void;
};

function RootLayout({ header, main }: Props) {
  return (
    <div className={styles.Layout}>
      <div className={styles.LayoutHeader}>{header}</div>
      <div className={styles.LayoutMain}>
        <div className={styles.LayoutContent}>{main}</div>
        <footer className={styles.LayoutFooter}>
          <RootFooter />
        </footer>
      </div>
    </div>
  );
}

function RootMobileSearchOverlayLayout({
  actions,
  body,
  header,
  onClose,
}: MobileSearchProps) {
  return (
    <div className={styles.LayoutMobileSearchOverlay} onClick={onClose}>
      <div
        className={styles.LayoutMobileSearchOverlayPanel}
        onClick={stopOverlayPropagation}
      >
        <div className={styles.LayoutMobileSearchOverlayHeader}>
          {header}
        </div>
        <div className={styles.LayoutMobileSearchOverlayBody}>{body}</div>
        <div className={styles.LayoutMobileSearchOverlayActions}>
          {actions}
        </div>
      </div>
    </div>
  );
}

function RootMobileDrawerLayout({
  body,
  footer,
  header,
  onClose,
}: MobileDrawerProps) {
  return (
    <div className={styles.LayoutMobileDrawer} onClick={onClose}>
      <aside
        className={styles.LayoutMobileDrawerPanel}
        onClick={stopOverlayPropagation}
      >
        <div className={styles.LayoutMobileDrawerHeader}>{header}</div>
        <div className={styles.LayoutMobileDrawerBody}>
          <div className={styles.LayoutMobileDrawerContent}>{body}</div>
          <div className={styles.LayoutMobileDrawerFooter}>{footer}</div>
        </div>
      </aside>
    </div>
  );
}

function stopOverlayPropagation(event: MouseEvent) {
  event.stopPropagation();
}

export {
  RootLayout,
  RootMobileDrawerLayout,
  RootMobileSearchOverlayLayout,
};
