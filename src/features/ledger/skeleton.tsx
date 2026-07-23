import { LedgerView, isLedgerView, useSettings } from "../settings";
import styles from "./skeleton.module.css";

const SKELETON_GROUP_ITEM_COUNTS = [8, 6, 10];

function CollectionSkeleton() {
  const settings = useSettings();
  const ledgerView = isLedgerView(settings, LedgerView.CARD) ? "card" : "list";

  return (
    <div
      className={styles.Skeleton}
      data-ledger-view={ledgerView}
      role="status"
      aria-busy="true"
      aria-label="Loading collection log"
    >
      <div aria-hidden="true">
        {SKELETON_GROUP_ITEM_COUNTS.map((itemCount, groupIndex) => (
          <SkeletonGroup
            itemCount={itemCount}
            key={`collection-skeleton-${groupIndex}`}
          />
        ))}
      </div>
    </div>
  );
}

function SkeletonGroup({ itemCount }: { itemCount: number }) {
  return (
    <section className={styles.SkeletonGroup}>
      <div className={styles.SkeletonHeader}>
        <div className={styles.SkeletonButton}>
          <span className={styles.SkeletonHeaderContent}>
            <span className={styles.SkeletonHeaderText}>
              <span className={styles.SkeletonTitle}>
                <span className={styles.SkeletonTitleName} />
                <span className={styles.SkeletonCounter} />
              </span>
              <span className={styles.SkeletonDescription} />
            </span>
            <span className={styles.SkeletonActions}>
              <span className={styles.SkeletonAction} />
            </span>
          </span>
        </div>
      </div>
      <div className={styles.SkeletonItems}>
        {Array.from({ length: itemCount }, (_, itemIndex) => (
          <SkeletonItem key={`collection-skeleton-item-${itemIndex}`} />
        ))}
      </div>
    </section>
  );
}

function SkeletonItem() {
  return (
    <div className={styles.SkeletonItem}>
      <span className={styles.SkeletonItemImage} />
      <span className={styles.SkeletonItemInfo}>
        <span className={styles.SkeletonItemName} />
        <span className={styles.SkeletonItemType} />
        <span className={styles.SkeletonItemDescription} />
      </span>
      <span className={styles.SkeletonItemIcons}>
        <span className={styles.SkeletonItemIcon} />
      </span>
    </div>
  );
}

export default CollectionSkeleton;
