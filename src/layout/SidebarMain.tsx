import styles from "./SidebarMain.module.css";
import React, { HTMLProps, ReactNode } from "react";

type Props = HTMLProps<HTMLDivElement> & {
  leftSidebar?: ReactNode;
  rightSidebar?: ReactNode;
  main?: ReactNode;
  hero?: ReactNode;
};

function SidebarMain({ leftSidebar, rightSidebar, main, hero, ...props }: Props) {
  const contentClassName = [
    styles.Content,
    leftSidebar ? styles.ContentWithLeftSidebar : null,
    rightSidebar ? styles.ContentWithRightSidebar : null,
  ]
    .filter(Boolean)
    .join(" ");

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
      <div className={contentClassName}>
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

export default SidebarMain;
