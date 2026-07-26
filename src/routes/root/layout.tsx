import type { ReactNode } from "react";
import classNames from "classnames";
import styles from "./layout.module.css";

type Props = {
  footer: ReactNode;
  header: ReactNode;
  isContentConstrained?: boolean;
  isFooterVisible?: boolean;
  main: ReactNode;
};

function Layout({
  footer,
  header,
  isContentConstrained = false,
  isFooterVisible = true,
  main,
}: Props) {
  const contentClassName = classNames(styles.LayoutContent, {
    [styles.LayoutContentConstrained]: isContentConstrained,
  });

  return (
    <div className={styles.Layout}>
      <div className={styles.LayoutHeader}>{header}</div>
      <div className={styles.LayoutMain} data-root-scroll-container="true">
        <div className={contentClassName}>{main}</div>
        {isFooterVisible && (
          <footer className={styles.LayoutFooter}>{footer}</footer>
        )}
      </div>
    </div>
  );
}

export { Layout };
