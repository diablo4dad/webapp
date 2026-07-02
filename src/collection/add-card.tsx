import { Plus } from "../components/Icons";
import styles from "./add-card.module.css";

type Props = {
  label: string;
  onClick: () => void;
};

function AddCard({ label, onClick }: Props) {
  return (
    <button
      type="button"
      className={styles.AddCard}
      onClick={onClick}
    >
      <div className={styles.AddCardVisual}>
        <span className={styles.AddCardIcon}>
          <Plus />
        </span>
      </div>
      <div className={styles.AddCardInfo}>
        <div className={styles.AddCardText}>{label}</div>
      </div>
    </button>
  );
}

export { AddCard };
