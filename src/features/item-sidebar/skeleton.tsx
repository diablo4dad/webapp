import Card from "../../shared/ui/Card";
import styles from "./skeleton.module.css";

const SKELETON_CLASS_ICONS = Array.from({ length: 8 });

function ItemSidebarSkeleton() {
  return (
    <Card
      className={styles.Skeleton}
      role="status"
      aria-busy="true"
      aria-label="Loading item details"
    >
      <div className={styles.SkeletonContent} aria-hidden="true">
        <div className={styles.SkeletonHeader}>
          <div className={styles.SkeletonHeading}>
            <span className={styles.SkeletonTitle} />
            <span className={styles.SkeletonType} />
          </div>
          <span className={styles.SkeletonImage} />
        </div>
        <div className={styles.SkeletonClasses}>
          {SKELETON_CLASS_ICONS.map((_, index) => (
            <span
              className={styles.SkeletonClassIcon}
              key={`item-sidebar-skeleton-class-${index}`}
            />
          ))}
        </div>
        <div className={styles.SkeletonActions}>
          <SkeletonAction />
          <SkeletonAction />
        </div>
        <div className={styles.SkeletonLocations}>
          <div className={styles.SkeletonLocation}>
            <div className={styles.SkeletonLocationInfo}>
              <span className={styles.SkeletonLocationDescription} />
              <span className={styles.SkeletonLocationCategory} />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function SkeletonAction() {
  return (
    <span className={styles.SkeletonAction}>
      <span className={styles.SkeletonToggle} />
      <span className={styles.SkeletonActionLabel} />
    </span>
  );
}

export { ItemSidebarSkeleton };
