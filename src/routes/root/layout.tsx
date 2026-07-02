import type { ReactNode } from "react";
import { RootFooter } from "./footer";
import styles from "./layout.module.css";

type Props = {
  header: ReactNode;
  main: ReactNode;
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

export { RootLayout };
