import type { ReactNode } from "react";
import styles from "./header-layout.module.css";

type Props = {
  actions: ReactNode;
  auth: ReactNode;
  logo: ReactNode;
  navigation?: ReactNode;
  search?: ReactNode;
  title: ReactNode;
};

function HeaderLayout({
  actions,
  auth,
  logo,
  navigation,
  search,
  title,
}: Props) {
  return (
    <header className={styles.HeaderLayout}>
      <div className={styles.HeaderLayoutBrand}>
        <div className={styles.HeaderLayoutLogo}>{logo}</div>
        <div className={styles.HeaderLayoutTitle}>{title}</div>
        {navigation && (
          <div className={styles.HeaderLayoutNavigation}>{navigation}</div>
        )}
      </div>
      <div className={styles.HeaderLayoutControls}>
        {search && (
          <div className={styles.HeaderLayoutSearch}>{search}</div>
        )}
        <div className={styles.HeaderLayoutButtons}>{actions}</div>
        <div className={styles.HeaderLayoutSpacer} />
        <div className={styles.HeaderLayoutAuth}>{auth}</div>
      </div>
    </header>
  );
}

export { HeaderLayout };
