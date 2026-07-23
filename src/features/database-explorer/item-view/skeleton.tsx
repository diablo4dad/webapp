import Card from "../../../shared/ui/Card";
import styles from "./skeleton.module.css";

const SKELETON_DETAIL_SECTION_COUNT = 2;

function ItemViewSkeleton() {
  return (
    <div className={styles.Skeleton}>
      <Card className={styles.SkeletonDetailCard}>
        <span className={styles.SkeletonDetailIcon} />
        <span className={styles.SkeletonDetailContent} />
        <span className={styles.SkeletonDetailContent} />
      </Card>
      {Array.from(
        { length: SKELETON_DETAIL_SECTION_COUNT },
        (_, index) => (
          <Card
            className={styles.SkeletonDetailSection}
            key={`database-detail-skeleton-${index}`}
          >
            <span />
          </Card>
        ),
      )}
    </div>
  );
}

export { ItemViewSkeleton };
