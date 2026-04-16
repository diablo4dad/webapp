import styles from "./Shell.module.css";
import React, { HTMLProps, ReactNode } from "react";

type Props = HTMLProps<HTMLDivElement> & {
  header?: ReactNode;
  stickyTop?: ReactNode;
  sidebar?: ReactNode;
  main?: ReactNode;
  stickyBottom?: ReactNode;
  footer?: ReactNode;
};

function Shell({
  header,
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
      <div className={styles.StickyTop}>{stickyTop}</div>
      <div className={styles.Main}>
        <div className={styles.Content}>{main}</div>
        <footer className={styles.Footer}>{footer}</footer>
      </div>
      <div className={styles.StickyBottom}>{stickyBottom}</div>
    </div>
  );
}

export default Shell;
