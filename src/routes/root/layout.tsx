import type { ReactNode } from "react";
import { DiscordInvite } from "../../components/DiscordPanel";
import { VersionInfo } from "../../components/VersionPanel";
import Shell from "../../layout/Shell";
import styles from "./route.module.css";

type Props = {
  header: ReactNode;
  main: ReactNode;
};

type HeaderProps = {
  actions: ReactNode;
  auth: ReactNode;
  logo: ReactNode;
  search: ReactNode;
  title: ReactNode;
};

export function RootLayout({ header, main }: Props) {
  return (
    <Shell
      header={header}
      main={main}
      footer={
        <>
          <DiscordInvite />
          <VersionInfo />
        </>
      }
    />
  );
}

export function RootHeaderLayout({
  actions,
  auth,
  logo,
  search,
  title,
}: HeaderProps) {
  return (
    <header className={styles.Header}>
      <div className={styles.HeaderBrand}>
        <div className={styles.HeaderLogo}>{logo}</div>
        <div className={styles.HeaderTitle}>{title}</div>
      </div>
      <div className={styles.HeaderControls}>
        <div className={styles.HeaderSearch}>{search}</div>
        <div className={styles.HeaderButtons}>{actions}</div>
        <div className={styles.HeaderSpacer} />
        <div className={styles.HeaderAuth}>{auth}</div>
      </div>
    </header>
  );
}
