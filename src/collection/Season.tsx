import { CSSProperties } from "react";
import season13 from "../image/season13@1x.webp";
import styles from "./Season.module.css";

function Season() {
  return (
    <div
      className={styles.SeasonCard}
      style={{ "--season-card-image": `url(${season13})` } as CSSProperties}
    >
      <div className={styles.SeasonEyebrow}>Current Season</div>
      <div className={styles.SeasonTitle}>Season 13</div>
      <div className={styles.SeasonName}>Season of Reckoning</div>
      <p className={styles.SeasonDescription}>
        Follow the latest seasonal cosmetics, rewards, and limited-time unlocks
        without losing track of your permanent collection goals.
      </p>
    </div>
  );
}

export default Season;
