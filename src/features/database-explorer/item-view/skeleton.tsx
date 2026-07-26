import classNames from "classnames";
import Card from "../../../shared/ui/Card";
import styles from "./skeleton.module.css";

const SKELETON_DETAIL_SECTION_COUNT = 2;
const SKELETON_HEADING_FIELD_COUNT = 3;
const SKELETON_META_FIELD_COUNT = 4;
const SKELETON_CLASS_CHIP_COUNT = 5;
const SKELETON_SECTION_FIELD_COUNT = 3;

function ItemViewSkeleton() {
  return (
    <div className={styles.Skeleton}>
      <span className={styles.SkeletonBackButton} />
      <div className={styles.SkeletonSummaryRow}>
        <Card
          className={classNames(
            styles.SkeletonDetailCard,
            styles.SkeletonOverviewCard,
          )}
        >
          <header className={styles.SkeletonDetailHeader}>
            <span className={styles.SkeletonDetailIcon} />
            <span className={styles.SkeletonDetailColumn}>
              <SkeletonFields
                count={SKELETON_HEADING_FIELD_COUNT}
                idPrefix="database-detail-heading-skeleton"
              />
            </span>
            <span className={styles.SkeletonDetailMetaColumn}>
              <SkeletonFields
                count={SKELETON_META_FIELD_COUNT}
                idPrefix="database-detail-meta-skeleton"
              />
            </span>
          </header>
        </Card>
        <Card
          className={classNames(
            styles.SkeletonDetailCard,
            styles.SkeletonClassCard,
          )}
        >
          <section className={styles.SkeletonDetailSection}>
            <span className={styles.SkeletonSectionTitle} />
            <span className={styles.SkeletonClassList}>
              {Array.from(
                { length: SKELETON_CLASS_CHIP_COUNT },
                (_, chipIndex) => (
                  <span
                    className={styles.SkeletonClassChip}
                    key={`database-detail-chip-skeleton-${chipIndex}`}
                  />
                ),
              )}
            </span>
          </section>
        </Card>
      </div>
      {Array.from(
        { length: SKELETON_DETAIL_SECTION_COUNT },
        (_, index) => (
          <Card
            className={styles.SkeletonDetailCard}
            key={`database-detail-skeleton-${index}`}
          >
            <section className={styles.SkeletonDetailSection}>
              <span className={styles.SkeletonSectionTitle} />
              <span className={styles.SkeletonDetailColumn}>
                <SkeletonFields
                  count={SKELETON_SECTION_FIELD_COUNT}
                  idPrefix={`database-detail-section-skeleton-${index}`}
                />
              </span>
            </section>
          </Card>
        ),
      )}
    </div>
  );
}

function SkeletonFields({
  count,
  idPrefix,
}: {
  count: number;
  idPrefix: string;
}) {
  return Array.from(
    { length: count },
    (_, index) => (
      <span
        className={styles.SkeletonField}
        key={`${idPrefix}-${index}`}
      >
        <span className={styles.SkeletonFieldLabel} />
        <span className={styles.SkeletonFieldValue} />
      </span>
    ),
  );
}

export { ItemViewSkeleton };
