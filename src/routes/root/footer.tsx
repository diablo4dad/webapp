import { Discord } from "../../components/Icons";
import { DISCORD_INVITE_LINK, LAST_UPDATED, SITE_VERSION } from "../../config";
import styles from "./footer.module.css";

function Footer() {
  return (
    <>
      <DiscordInvite />
      <VersionInfo />
    </>
  );
}

function DiscordInvite() {
  return (
    <div className={styles.FooterDiscordInvite}>
      <div className={styles.FooterDiscordInviteIcon}>
        <a href={DISCORD_INVITE_LINK}>
          <Discord />
        </a>
      </div>
      <div className={styles.FooterDiscordInviteInfo}>
        <a
          className={styles.FooterDiscordInviteInfoLink}
          href={DISCORD_INVITE_LINK}
        >
          Join the Discord Server
        </a>
        <div className={styles.FooterDiscordInviteInfoSlugs}>
          Site News | Community | Bragging
        </div>
      </div>
    </div>
  );
}

function VersionInfo() {
  return (
    <div className={styles.FooterVersionInfo}>
      <div>Last updated {LAST_UPDATED}</div>
      <div>
        Site Version <code>{SITE_VERSION}</code>
      </div>
    </div>
  );
}

export { Footer };
