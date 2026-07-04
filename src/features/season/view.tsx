import type { CSSProperties } from "react";
import type { SeasonViewModel } from "./view-model";
import styles from "./view.module.css";

type ViewProps = {
  season: SeasonViewModel;
};

function SeasonView({ season }: ViewProps) {
  return (
    <div
      className={styles.SeasonCard}
      style={{ "--season-card-image": `url(${season.image})` } as CSSProperties}
    >
      <div className={styles.SeasonEyebrow}>Current Season</div>
      <div className={styles.SeasonTitle}>{season.title}</div>
      <div className={styles.SeasonName}>{season.name}</div>
      <p className={styles.SeasonDescription}>
        Follow the latest seasonal cosmetics, rewards, and limited-time unlocks
        without losing track of your permanent collection goals.
      </p>
    </div>
  );
}

export { SeasonView };
