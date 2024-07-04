import styles from "./Shell.module.css";
import React, { ReactNode } from "react";

type Props = {
  header: ReactNode;
  sidebar: ReactNode;
  main: ReactNode;
  footerSticky: ReactNode;
  footer: ReactNode;
};

function Shell({ header, sidebar, main, footerSticky, footer }: Props) {
  return (
    <div className={styles.Page}>
      <div className={styles.PageHeader}>{header}</div>
      <div className={styles.PageContent}>
        <div className={styles.Shell}>
          <aside className={styles.Sidebar}>{sidebar}</aside>
          <main className={styles.Content}>{main}</main>
        </div>
      </div>
      <div className={styles.ProgressMobile}>{footerSticky}</div>
      <div className={styles.Footer}>{footer}</div>
    </div>
  );
}

export default Shell;
