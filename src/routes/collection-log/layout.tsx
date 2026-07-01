import classNames from "classnames";
import type { ReactNode } from "react";
import styles from "./layout.module.css";

type Props = {
  hero: ReactNode;
  main: ReactNode;
  leftSidebar?: ReactNode;
  rightSidebar?: ReactNode;
};

export function CollectionLogLayout({
  leftSidebar,
  rightSidebar,
  main,
  hero,
}: Props) {
  const mainClassName = classNames(styles.LayoutMain, {
    [styles.LayoutMainWithBothSidebars]: leftSidebar && rightSidebar,
    [styles.LayoutMainWithLeftSidebar]: leftSidebar && !rightSidebar,
    [styles.LayoutMainWithRightSidebar]: !leftSidebar && rightSidebar,
    [styles.LayoutMainFullWidth]: !leftSidebar && !rightSidebar,
  });

  return (
    <div className={styles.Layout}>
      <div className={styles.LayoutHero}>{hero}</div>
      <div className={styles.LayoutContent}>
        {leftSidebar && (
          <aside className={styles.LayoutLeftSidebar}>
            {leftSidebar}
          </aside>
        )}
        <main className={mainClassName}>{main}</main>
        {rightSidebar && (
          <aside className={styles.LayoutRightSidebar}>
            {rightSidebar}
          </aside>
        )}
      </div>
    </div>
  );
}
