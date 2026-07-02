import type { MouseEvent, ReactNode } from "react";
import Shell from "../../layout/Shell";
import { RootFooter } from "./footer";
import styles from "./layout.module.css";

type Props = {
  header: ReactNode;
  main: ReactNode;
};

type HeaderProps = {
  actions: ReactNode;
  auth: ReactNode;
  logo: ReactNode;
  search: ReactNode;
  title: ReactNode;
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
    <Shell
      header={header}
      main={main}
      footer={<RootFooter />}
    />
  );
}

function RootHeaderLayout({
  actions,
  auth,
  logo,
  search,
  title,
}: HeaderProps) {
  return (
    <header className={styles.LayoutHeader}>
      <div className={styles.LayoutHeaderBrand}>
        <div className={styles.LayoutHeaderLogo}>{logo}</div>
        <div className={styles.LayoutHeaderTitle}>{title}</div>
      </div>
      <div className={styles.LayoutHeaderControls}>
        <div className={styles.LayoutHeaderSearch}>{search}</div>
        <div className={styles.LayoutHeaderButtons}>{actions}</div>
        <div className={styles.LayoutHeaderSpacer} />
        <div className={styles.LayoutHeaderAuth}>{auth}</div>
      </div>
    </header>
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
  RootHeaderLayout,
  RootLayout,
  RootMobileDrawerLayout,
  RootMobileSearchOverlayLayout,
};
