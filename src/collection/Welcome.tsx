import { CSSProperties } from "react";
import { Discord, GitHub } from "../components/Icons";
import { DISCORD_INVITE_LINK } from "../config";
import wardrobe from "../image/wardrobe@1x.png";
import styles from "./Welcome.module.css";

function Welcome() {
  return (
    <>
      <div
        className={styles.Welcome}
        style={{ "--welcome-image": `url(${wardrobe})` } as CSSProperties}
      >
        <div className={styles.WelcomeContent}>
          <div className={styles.WelcomeCopy}>
            <h1>Transmog Database</h1>
            <p>
              Track every transmog and pet in Sanctuary. Check off what you own,
              discover what you're missing.
            </p>
          </div>
          <p className={styles.WelcomeDiscord}>
            <span className={styles.WelcomeDiscordIcon}>
              <Discord />
            </span>
            <span className={styles.WelcomeDiscordCopy}>
              Stay in the loop, never miss a transmog drop.
              <br />
              <a
                className={styles.WelcomeDiscordLink}
                href={DISCORD_INVITE_LINK}
                target="_blank"
                rel="noreferrer"
              >
                Join the Discord Server
              </a>
            </span>
          </p>
          <p className={styles.WelcomeDiscord}>
            <span className={styles.WelcomeDiscordIcon}>
              <GitHub />
            </span>
            <span className={styles.WelcomeDiscordCopy}>
              Diablo IV Dad is an open source project.
              <br />
              <a
                className={styles.WelcomeDiscordLink}
                href="https://github.com/diablo4dad"
                target="_blank"
                rel="noreferrer"
              >
                Contribute on GitHub
              </a>
            </span>
          </p>
        </div>
      </div>
    </>
  );
}

export default Welcome;
