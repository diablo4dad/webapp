import classNames from "classnames";
import { Plus } from "../components/Icons";
import styles from "./Ledger.module.css";

type Props = {
  label: string;
  onClick: () => void;
};

function AddCard({ label, onClick }: Props) {
  return (
    <button
      type="button"
      className={classNames(styles.Item, styles.ItemAdd)}
      onClick={onClick}
    >
      <div className={styles.ItemAddVisual}>
        <span className={styles.ItemAddIcon}>
          <Plus />
        </span>
      </div>
      <div className={styles.ItemAddInfo}>
        <div className={styles.ItemAddText}>{label}</div>
      </div>
    </button>
  );
}

export { AddCard };
