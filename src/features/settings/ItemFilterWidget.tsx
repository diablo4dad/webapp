import { MouseEvent } from "react";
import styles from "./ItemFilterWidget.module.css";

type Props = {
  active: boolean;
  count: number;
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
};

function ItemFilterWidget({ active, count, label, onClick }: Props) {
  return (
    <button
      aria-pressed={active}
      className={`${styles.Button} ${active ? styles.ButtonActive : ""}`}
      onClick={onClick}
      type="button"
    >
      <span className={styles.Label}>{label}</span>
      <span className={styles.Count}>{count}</span>
    </button>
  );
}

export default ItemFilterWidget;
