import { MouseEvent } from "react";
import type { ItemFilterCount } from "../../shared/lib/widget";
import styles from "./item-filter-widget.module.css";

type Props = {
  active: boolean;
  count: ItemFilterCount;
  countDisplay?: CountDisplay;
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
};

type CountDisplay = "owned-total" | "total";

function ItemFilterWidget({
  active,
  count,
  countDisplay = "owned-total",
  label,
  onClick,
}: Props) {
  const countLabel = formatCount(count, countDisplay);

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

function formatCount(count: ItemFilterCount, countDisplay: CountDisplay): string {
  if (countDisplay === "total") {
    return formatNumber(count.total);
  }

  return `${formatNumber(count.owned)}/${formatNumber(count.total)}`;
}

export { ItemFilterWidget };
