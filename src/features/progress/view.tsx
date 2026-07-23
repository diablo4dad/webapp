import classNames from "classnames";
import Card from "../../shared/ui/Card";
import { Star } from "../../shared/ui/Icons";
import type { ProgressCardViewModel } from "./view-model";
import styles from "./view.module.css";

type ProgressLayout = "expanded" | "stacked";

type Props = ProgressCardViewModel & {
  className?: string;
  layout?: ProgressLayout;
};

function ProgressView({
  className,
  collected,
  iconSrc,
  isComplete,
  layout = "expanded",
  percent,
  title,
  total,
}: Props) {
  const cardClassName = classNames(styles.View, className, {
    [styles.ViewExpanded]: layout === "expanded",
  });

  return (
    <Card className={cardClassName}>
      <div className={styles.ViewIcon}>
        <img src={iconSrc} alt="" />
      </div>
      <div className={styles.ViewLabel}>Collection</div>
      <div className={styles.ViewSummary}>
        <div className={styles.ViewTitle}>{title}</div>
        <div className={styles.ViewStats}>
          <span className={styles.ViewCurrent}>
            {formatNumber(collected)}
          </span>
          <span className={styles.ViewDivider}>/</span>
          <span>{formatNumber(total)}</span>
        </div>
      </div>
      <div className={styles.ViewBar}>
        <span
          className={styles.ViewBarFill}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className={styles.ViewDetail}>
        <span>
          {formatNumber(collected)} collected from {formatNumber(total)} total
        </span>
        {isComplete && (
          <span className={styles.ViewComplete}>
            <Star />
          </span>
        )}
      </p>
    </Card>
  );
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

export { ProgressView };
export type { ProgressLayout };
export type { Props as ProgressViewProps };
