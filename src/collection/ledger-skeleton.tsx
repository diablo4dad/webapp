import styles from "./ledger-skeleton.module.css";

function LedgerSkeleton() {
  return (
    <div className={styles.LedgerSkeleton}>
      {Array.from({ length: 5 }, (_, k) => (
        <div className={styles.LedgerSkeletonHeader} key={k}>
          <div className={styles.LedgerSkeletonButton}>
            <div>
              <h1 className={styles.LedgerSkeletonTitle}>
                <span>{"Loading... Loading..."}</span>
              </h1>
              <div className={styles.LedgerSkeletonDescription}>
                <span>
                  {"Loading... Loading... Loading... Loading... Loading..."}
                </span>
              </div>
            </div>
            <span className={styles.LedgerSkeletonActions}>
              <span />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default LedgerSkeleton;
