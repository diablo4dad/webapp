import styles from "./skeleton.module.css";

const SKELETON_FILTER_COUNT = 2;
const SKELETON_SUMMARY_STAT_COUNT = 3;

function ProgressOverviewSkeleton() {
  return (
    <header className={styles.Skeleton}>
      <div className={styles.SkeletonContent}>
        <div className={styles.SkeletonHeading}>
          <div className={styles.SkeletonMeta}>
            <span className={styles.SkeletonScopeIcon} />
            <span className={styles.SkeletonMetaText}>
              <span className={styles.SkeletonEyebrow} />
              <span className={styles.SkeletonScopePosition} />
            </span>
            <span className={styles.SkeletonScopeControls}>
              <span className={styles.SkeletonScopeControl} />
              <span className={styles.SkeletonScopeControl} />
            </span>
          </div>
          <span className={styles.SkeletonTitle} />
        </div>
        <div className={styles.SkeletonSummary}>
          <span className={styles.SkeletonMeter}>
            <span className={styles.SkeletonMeterLabel} />
            <span className={styles.SkeletonMeterValue} />
            <span className={styles.SkeletonMeterLabel} />
          </span>
          <div className={styles.SkeletonScopeStats}>
            {Array.from(
              { length: SKELETON_SUMMARY_STAT_COUNT },
              (_, index) => (
                <span
                  className={styles.SkeletonScopeStat}
                  key={`stats-summary-skeleton-${index}`}
                >
                  <span className={styles.SkeletonScopeStatValue} />
                  <span className={styles.SkeletonScopeStatLabel} />
                </span>
              ),
            )}
          </div>
        </div>
        <div className={styles.SkeletonFilters}>
          {Array.from({ length: SKELETON_FILTER_COUNT }, (_, index) => (
            <span
              className={styles.SkeletonFilter}
              key={`stats-filter-skeleton-${index}`}
            >
              <span className={styles.SkeletonFilterToggle} />
              <span className={styles.SkeletonFilterLabel} />
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}

export { ProgressOverviewSkeleton };
