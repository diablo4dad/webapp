import React, { ReactElement } from "react";
import styles from "../Application.module.css";
import { DISCORD_INVITE_LINK } from "../config";
import { Discord } from "../Icons";

export function DiscordInvite(): ReactElement<HTMLDivElement> {
  return (
    <div className={styles.Discord}>
      <div className={styles.DiscordIcon}>
        <a href={DISCORD_INVITE_LINK}>
          <Discord></Discord>
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
