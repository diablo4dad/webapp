import Card from "../../shared/ui/Card";
import styles from "./skeleton.module.css";

function ProgressOverviewSkeleton() {
  return (
    <Card className={styles.Skeleton}>
      <header className={styles.SkeletonContent}>
        <div className={styles.SkeletonHeading}>
          <div className={styles.SkeletonMeta}>
            <span className={styles.SkeletonScopeIcon} />
            <span className={styles.SkeletonMetaText} />
            <span className={styles.SkeletonScopeControls} />
          </div>
          <span className={styles.SkeletonTitle} />
        </div>
        <div className={styles.SkeletonSummary}>
          <span className={styles.SkeletonMeter} />
          <span className={styles.SkeletonScopeStats} />
        </div>
        <span className={styles.SkeletonFilters} />
      </header>
    </Card>
  );
}

export { ProgressOverviewSkeleton };
