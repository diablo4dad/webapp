import styles from "./Shell.module.css";
import React, { HTMLProps, ReactNode } from "react";

type Props = HTMLProps<HTMLDivElement> & {
  sidebar?: ReactNode;
  main?: ReactNode;
};

function SidebarMain({ sidebar, main, ...props }: Props) {
  return (
    <div {...props} className={styles.Content}>
      <aside className={styles.Sidebar}>{sidebar}</aside>
      <main className={styles.Main}>{main}</main>
    </div>
  );
}

export default SidebarMain;
