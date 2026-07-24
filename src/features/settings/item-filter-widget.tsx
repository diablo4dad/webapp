import { MouseEvent } from "react";
import type { ItemFilterCount } from "../../shared/lib/widget";
import styles from "./item-filter-widget.module.css";

type Props = {
  active: boolean;
  count: ItemFilterCount;
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
};

function ItemFilterWidget({ active, count, label, onClick }: Props) {
  const countLabel = `${formatNumber(count.owned)}/${formatNumber(count.total)}`;

  return (
    <button
      aria-pressed={active}
      className={`${styles.Button} ${active ? styles.ButtonActive : ""}`}
      onClick={onClick}
      type="button"
    >
      <span className={styles.Label}>{label}</span>
      <span className={styles.Count}>{countLabel}</span>
    </button>
  );
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

export { ItemFilterWidget };
