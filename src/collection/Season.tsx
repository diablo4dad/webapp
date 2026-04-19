import { CSSProperties } from "react";
import season12 from "../image/season12.png";
import styles from "./Season.module.css";

function Season() {
  return (
    <div
      className={styles.SeasonCard}
      style={{ "--season-card-image": `url(${season12})` } as CSSProperties}
    >
      <div className={styles.SeasonEyebrow}>Current Season</div>
      <div className={styles.SeasonTitle}>Season 12</div>
      <div className={styles.SeasonName}>Season of Slaughter</div>
      <p className={styles.SeasonDescription}>
        Follow the latest seasonal cosmetics, rewards, and limited-time
        unlocks without losing track of your permanent collection goals.
      </p>
    </div>
  );
}

export default Season;
