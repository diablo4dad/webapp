import type { MouseEvent, ReactNode } from "react";
import styles from "./mobile-settings-layout.module.css";

type Props = {
  body: ReactNode;
  footer: ReactNode;
  header: ReactNode;
  onClose: () => void;
};

function MobileSettingsLayout({
  body,
  footer,
  header,
  onClose,
}: Props) {
  return (
    <div className={styles.MobileSettingsLayout} onClick={onClose}>
      <aside
        className={styles.MobileSettingsLayoutPanel}
        onClick={stopPropagation}
      >
        <div className={styles.MobileSettingsLayoutHeader}>{header}</div>
        <div className={styles.MobileSettingsLayoutBody}>
          <div className={styles.MobileSettingsLayoutContent}>{body}</div>
          <div className={styles.MobileSettingsLayoutFooter}>{footer}</div>
        </div>
      </aside>
    </div>
  );
}

function stopPropagation(event: MouseEvent) {
  event.stopPropagation();
}

export { MobileSettingsLayout };
