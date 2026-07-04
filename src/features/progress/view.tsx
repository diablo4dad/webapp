import classNames from "classnames";
import Card from "../../shared/ui/Card";
import { Star } from "../../shared/ui/Icons";
import type { ProgressCardViewModel, ProgressViewModel } from "./view-model";
import styles from "./view.module.css";

type Props = {
  className?: string;
  layout?: "expanded" | "stacked";
  model: ProgressViewModel;
};

function ProgressView({ className, layout = "expanded", model }: Props) {
  const progressClassName = classNames(styles.ProgressList, className, {
    [styles.ProgressListExpanded]: layout === "expanded",
    [styles.ProgressListStacked]: layout === "stacked",
  });

  return (
    <div className={progressClassName}>
      {model.cards.map((card) => (
        <ProgressCard key={card.title} {...card} />
      ))}
    </div>
  );
}

function ProgressCard({
  title,
  iconSrc,
  collected,
  total,
  percent,
  isComplete,
}: ProgressCardViewModel) {
  return (
    <Card className={styles.ProgressCard}>
      <div className={styles.ProgressCardIcon}>
        <img src={iconSrc} alt="" />
      </div>
      <div className={styles.ProgressCardLabel}>Collection</div>
      <div className={styles.ProgressCardSummary}>
        <div className={styles.ProgressCardTitle}>{title}</div>
        <div className={styles.ProgressCardStats}>
          <span className={styles.ProgressCardCurrent}>{collected}</span>
          <span className={styles.ProgressCardDivider}>/</span>
          <span>{total}</span>
        </div>
      </div>
      <div className={styles.ProgressCardBar}>
        <span
          className={styles.ProgressCardBarFill}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className={styles.ProgressCardDetail}>
        <span>
          {collected} collected from {total} total
        </span>
        {isComplete && (
          <span className={styles.ProgressCardComplete}>
            <Star />
          </span>
        )}
      </p>
    </Card>
  );
}

export { ProgressView };
export type { Props as ProgressViewProps };
