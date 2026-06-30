import type { ReactNode } from "react";
import { DISCORD_INVITE_LINK, LAST_UPDATED, SITE_VERSION } from "../../config";
import { Discord } from "../../components/Icons";
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

function DiscordInvite() {
  return (
    <div className={styles.Discord}>
      <div className={styles.DiscordIcon}>
        <a href={DISCORD_INVITE_LINK}>
          <Discord />
        </a>
      </div>
      <div className={styles.DiscordInfo}>
        <a className={styles.DiscordInfoLink} href={DISCORD_INVITE_LINK}>
          Join the Discord Server
        </a>
        <div className={styles.DiscordInfoSlugs}>
          Site News | Community | Bragging
        </div>
      </div>
    </div>
  );
}

function VersionInfo() {
  return (
    <div className={styles.SiteVersion}>
      <div>Last updated {LAST_UPDATED}</div>
      <div>
        Site Version <code>{SITE_VERSION}</code>
      </div>
    </div>
  );
}
