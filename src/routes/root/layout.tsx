import type { ReactNode } from "react";
import styles from "./layout.module.css";

type Props = {
  footer: ReactNode;
  header: ReactNode;
  main: ReactNode;
};

function RootLayout({ footer, header, main }: Props) {
  return (
    <div className={styles.Layout}>
      <div className={styles.LayoutHeader}>{header}</div>
      <div className={styles.LayoutMain}>
        <div className={styles.LayoutContent}>{main}</div>
        <footer className={styles.LayoutFooter}>{footer}</footer>
      </div>
    </div>
  );
}

export { RootLayout };
