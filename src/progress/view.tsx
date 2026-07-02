import classNames from "classnames";
import Card from "../components/Card";
import { Star } from "../components/Icons";
import type { ProgressStats } from "./state";
import styles from "./progress.module.css";

type ProgressCard = ProgressStats & {
  iconSrc?: string;
  title: string;
};

type Props = {
  cards: readonly ProgressCard[];
  className?: string;
  layout?: "expanded" | "stacked";
};

function ProgressView({ cards, className, layout = "expanded" }: Props) {
  const progressClassName = classNames(styles.ProgressList, className, {
    [styles.ProgressListExpanded]: layout === "expanded",
    [styles.ProgressListStacked]: layout === "stacked",
  });

  return (
    <div className={progressClassName}>
      {cards.map((card) => (
        <CollectionProgressCard key={card.title} {...card} />
      ))}
    </div>
  );
}

function CollectionProgressCard({
  title,
  iconSrc,
  collected,
  total,
  percent,
  isComplete,
}: ProgressCard) {
  return (
    <Card className={styles.ProgressCard}>
      {iconSrc && (
        <div className={styles.ProgressCardIcon}>
          <img src={iconSrc} alt="" />
        </div>
      )}
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
export type { ProgressCard, Props as ProgressViewProps };
