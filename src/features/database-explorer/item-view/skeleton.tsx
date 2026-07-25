import Card from "../../../shared/ui/Card";
import styles from "./skeleton.module.css";

const SKELETON_DETAIL_SECTION_COUNT = 2;
const SKELETON_HEADING_FIELD_COUNT = 3;
const SKELETON_META_FIELD_COUNT = 4;
const SKELETON_CLASS_CHIP_COUNT = 5;

function ItemViewSkeleton() {
  return (
    <div className={styles.Skeleton}>
      <span className={styles.SkeletonBackButton} />
      <Card className={styles.SkeletonDetailCard}>
        <header className={styles.SkeletonDetailHeader}>
          <span className={styles.SkeletonDetailIcon} />
          <span className={styles.SkeletonDetailColumn}>
            {Array.from(
              { length: SKELETON_HEADING_FIELD_COUNT },
              (_, index) => (
                <span
                  className={styles.SkeletonField}
                  key={`database-detail-heading-skeleton-${index}`}
                >
                  <span className={styles.SkeletonFieldLabel} />
                  <span className={styles.SkeletonFieldValue} />
                </span>
              ),
            )}
          </span>
          <span className={styles.SkeletonDetailColumn}>
            {Array.from(
              { length: SKELETON_META_FIELD_COUNT },
              (_, index) => (
                <span
                  className={styles.SkeletonField}
                  key={`database-detail-meta-skeleton-${index}`}
                >
                  <span className={styles.SkeletonFieldLabel} />
                  <span className={styles.SkeletonFieldValue} />
                </span>
              ),
            )}
          </span>
        </header>
      </Card>
      {Array.from(
        { length: SKELETON_DETAIL_SECTION_COUNT },
        (_, index) => (
          <Card
            className={styles.SkeletonDetailSection}
            key={`database-detail-skeleton-${index}`}
          >
            <span className={styles.SkeletonSectionTitle} />
            <span className={styles.SkeletonClassList}>
              {Array.from(
                { length: SKELETON_CLASS_CHIP_COUNT },
                (_, chipIndex) => (
                  <span
                    className={styles.SkeletonClassChip}
                    key={`database-detail-chip-skeleton-${index}-${chipIndex}`}
                  />
                ),
              )}
            </span>
          </Card>
        ),
      )}
    </div>
  );
}

export { ItemViewSkeleton };
