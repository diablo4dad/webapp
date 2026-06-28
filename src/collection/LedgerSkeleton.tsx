import styles from "./Ledger.module.css";
import React from "react";
import classNames from "classnames";

function LedgerSkeleton() {
  const classNameStr = classNames(styles.Ledger, styles.Skeleton);

  return (
    <div className={classNameStr}>
      {Array.from({ length: 5 }, (_, k) => (
        <div className={styles.LedgerHeader} key={k}>
          <div className={styles.LedgerButton}>
            <div>
              <h1 className={styles.LedgerTitle}>
                <span>{"Loading... Loading..."}</span>
              </h1>
              <div className={styles.LedgerDescription}>
                <span>
                  {"Loading... Loading... Loading... Loading... Loading..."}
                </span>
              </div>
            </div>
            <span className={styles.LedgerActions}>
              <span />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default LedgerSkeleton;
