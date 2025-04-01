import styles from "./Shell.module.css";
import React, { HTMLProps, ReactNode } from "react";

type Props = HTMLProps<HTMLDivElement> & {
  header?: ReactNode;
  settingsBar?: ReactNode;
  stickyTop?: ReactNode;
  sidebar?: ReactNode;
  main?: ReactNode;
  stickyBottom?: ReactNode;
  footer?: ReactNode;
};

function Shell({
  header,
  settingsBar,
  stickyTop,
  sidebar,
  main,
  stickyBottom,
  footer,
  ...props
}: Props) {
  return (
    <div {...props} className={styles.Block}>
      <div className={styles.Header}>{header}</div>
      <div className={styles.SettingsBar}>{settingsBar}</div>
      <div className={styles.StickyTop}>{stickyTop}</div>
      <div className={styles.Content}>
        <aside className={styles.Sidebar}>{sidebar}</aside>
        <main className={styles.Main}>{main}</main>
      </div>
      <div className={styles.StickyBottom}>{stickyBottom}</div>
      <footer className={styles.Footer}>{footer}</footer>
    </div>
  );
}

export default Shell;
