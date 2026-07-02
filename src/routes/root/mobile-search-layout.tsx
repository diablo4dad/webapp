import type { MouseEvent, ReactNode } from "react";
import styles from "./mobile-search-layout.module.css";

type Props = {
  actions: ReactNode;
  body: ReactNode;
  header: ReactNode;
  onClose: () => void;
};

function MobileSearchLayout({
  actions,
  body,
  header,
  onClose,
}: Props) {
  return (
    <div className={styles.MobileSearchLayout} onClick={onClose}>
      <div
        className={styles.MobileSearchLayoutPanel}
        onClick={stopPropagation}
      >
        <div className={styles.MobileSearchLayoutHeader}>{header}</div>
        <div className={styles.MobileSearchLayoutBody}>{body}</div>
        <div className={styles.MobileSearchLayoutActions}>{actions}</div>
      </div>
    </div>
  );
}

function stopPropagation(event: MouseEvent) {
  event.stopPropagation();
}

export { MobileSearchLayout };
