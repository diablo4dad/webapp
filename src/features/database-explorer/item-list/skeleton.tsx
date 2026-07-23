import Card from "../../../shared/ui/Card";
import styles from "./skeleton.module.css";

const SKELETON_ROW_COUNT = 10;

function ItemListSkeleton() {
  return (
    <Card className={styles.Skeleton}>
      <div className={styles.SkeletonStickyControls}>
        <header className={styles.SkeletonListHeader}>
          <span className={styles.SkeletonTitle} />
          <span className={styles.SkeletonSort} />
        </header>
        <div className={styles.SkeletonFilters} />
      </div>
      <div data-database-list className={styles.SkeletonList}>
        {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
          <span
            className={styles.SkeletonRow}
            key={`database-row-skeleton-${index}`}
          />
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
