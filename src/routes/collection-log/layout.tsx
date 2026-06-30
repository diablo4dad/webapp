import type { HTMLProps, ReactNode } from "react";
import styles from "./layout.module.css";

type Props = HTMLProps<HTMLDivElement> & {
  leftSidebar?: ReactNode;
  rightSidebar?: ReactNode;
  main?: ReactNode;
  hero?: ReactNode;
};

export function CollectionLogLayout({
  leftSidebar,
  rightSidebar,
  main,
  hero,
  ...props
}: Props) {
  const mainClassName = [
    styles.Main,
    leftSidebar && rightSidebar ? styles.MainWithBothSidebars : null,
    leftSidebar && !rightSidebar ? styles.MainWithLeftSidebar : null,
    !leftSidebar && rightSidebar ? styles.MainWithRightSidebar : null,
    !leftSidebar && !rightSidebar ? styles.MainFullWidth : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div {...props} className={styles.Block}>
      <div className={styles.Hero}>{hero}</div>
      <div className={styles.Content}>
        {leftSidebar && (
          <aside className={styles.LeftSidebar}>{leftSidebar}</aside>
        )}
        <main className={mainClassName}>{main}</main>
        {rightSidebar && (
          <aside className={styles.RightSidebar}>{rightSidebar}</aside>
        )}
      </div>
    </div>
  );
}
