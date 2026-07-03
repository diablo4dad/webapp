import { Plus } from "../shared/ui/Icons";
import styles from "./ledger-group-add-card.module.css";

type Props = {
  label: string;
  onClick: () => void;
};

function LedgerGroupAddCard({ label, onClick }: Props) {
  return (
    <button
      type="button"
      className={styles.LedgerGroupAddCard}
      onClick={onClick}
    >
      <div className={styles.LedgerGroupAddCardVisual}>
        <span className={styles.LedgerGroupAddCardIcon}>
          <Plus />
        </span>
      </div>
      <div className={styles.LedgerGroupAddCardInfo}>
        <div className={styles.LedgerGroupAddCardText}>{label}</div>
      </div>
    </button>
  );
}

export { LedgerGroupAddCard };
