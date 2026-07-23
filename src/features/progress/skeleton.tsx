import classNames from "classnames";
import Card from "../../shared/ui/Card";
import type { ProgressLayout } from "./view";
import styles from "./skeleton.module.css";

type Props = {
  className?: string;
  layout?: ProgressLayout;
};

function ProgressSkeleton({
  className,
  layout = "expanded",
}: Props) {
  const cardClassName = classNames(styles.Skeleton, className, {
    [styles.SkeletonExpanded]: layout === "expanded",
  });

  return (
    <Card className={cardClassName}>
      <span className={styles.SkeletonIcon} />
      <span className={styles.SkeletonContent}>
        <span className={styles.SkeletonTitle} />
        <span className={styles.SkeletonStats} />
      </span>
      <span className={styles.SkeletonBar} />
    </Card>
  );
}

export { ProgressSkeleton };
