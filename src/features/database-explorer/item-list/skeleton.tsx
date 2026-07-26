import Card from "../../../shared/ui/Card";
import styles from "./skeleton.module.css";

const SKELETON_ROW_COUNT = 10;
const SKELETON_FILTER_COUNT = 3;

function ItemListSkeleton() {
  return (
    <Card aria-hidden="true" className={styles.Skeleton}>
      <div className={styles.SkeletonStickyControls}>
        <header className={styles.SkeletonListHeader}>
          <span className={styles.SkeletonTitle} />
          <span className={styles.SkeletonHeaderActions}>
            <span className={styles.SkeletonSort} />
            <span className={styles.SkeletonAction} />
          </span>
        </header>
        <section className={styles.SkeletonFilterControls}>
          <div className={styles.SkeletonFilterControlList}>
            {Array.from(
              { length: SKELETON_FILTER_COUNT },
              (_, index) => (
                <span
                  className={styles.SkeletonFilterControl}
                  key={`database-filter-skeleton-${index}`}
                >
                  <span className={styles.SkeletonFilterLabel} />
                  <span className={styles.SkeletonFilterValue} />
                </span>
              ),
            )}
          </div>
        </section>
      </div>
      <div data-database-list className={styles.SkeletonList}>
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
          <span
            className={styles.SkeletonRow}
            key={`database-row-skeleton-${index}`}
          >
            <span className={styles.SkeletonRowName} />
            <span className={styles.SkeletonRowMeta} />
          </span>
        ))}
      </div>
      <section className={styles.SkeletonStats}>
        <span />
        <span />
      </section>
    </Card>
  );
}

export { ItemListSkeleton };
