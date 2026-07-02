import type { ReactNode } from "react";
import styles from "./header-layout.module.css";

type Props = {
  actions: ReactNode;
  auth: ReactNode;
  logo: ReactNode;
  search: ReactNode;
  title: ReactNode;
};

function HeaderLayout({
  actions,
  auth,
  logo,
  search,
  title,
}: Props) {
  return (
    <header className={styles.HeaderLayout}>
      <div className={styles.HeaderLayoutBrand}>
        <div className={styles.HeaderLayoutLogo}>{logo}</div>
        <div className={styles.HeaderLayoutTitle}>{title}</div>
      </div>
      <div className={styles.HeaderLayoutControls}>
        <div className={styles.HeaderLayoutSearch}>{search}</div>
        <div className={styles.HeaderLayoutButtons}>{actions}</div>
        <div className={styles.HeaderLayoutSpacer} />
        <div className={styles.HeaderLayoutAuth}>{auth}</div>
      </div>
    </header>
  );
}

export { HeaderLayout };
