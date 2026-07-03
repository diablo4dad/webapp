import { MouseEvent } from "react";
import styles from "./CollectionFilterWidget.module.css";

type Props = {
  active: boolean;
  icon: string;
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
};

function CollectionFilterWidget({ active, icon, label, onClick }: Props) {
  return (
    <button
      aria-pressed={active}
      className={`${styles.Button} ${active ? styles.ButtonActive : ""}`}
      onClick={onClick}
      type="button"
    >
      <span className={styles.Label}>{label}</span>
      <span className={styles.Trailing}>
        <span className={styles.RadioOuter} aria-hidden="true">
          <span className={styles.RadioInner} />
        </span>
        <span className={styles.Icon} aria-hidden="true">
          <img src={icon} alt="" />
        </span>
      </span>
    </button>
  );
}

export default CollectionFilterWidget;
