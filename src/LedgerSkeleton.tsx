import styles from "./Ledger.module.css";
import React from "react";
import { Currency } from "./Icons";
import imgfill from "./image/imgfill.png";

type Props = {
  view: "list" | "card";
  numItems: number;
};

function LedgerSkeleton({ view, numItems = 3 }: Props) {
  return (
    <div
      className={
        styles.Ledger + " " + (view === "card" ? styles.LedgerCards : "")
      }
    >
      <div className={styles.LedgerHeader}>
        <div
          className={styles.LedgerTitle + " " + styles.LedgerHeadingPlaceholder}
        >
          Loading...
        </div>
        <div
          className={
            styles.LedgerDescription + " " + styles.LedgerDescriptionPlaceholder
          }
        >
          Loading Loading Loading...
        </div>
      </div>
      <div className={styles.LedgerRow}>
        {new Array(numItems).fill(0).map((_, k) => (
          <div className={styles.Item} key={k}>
            <img
              className={styles.ItemImage + " " + styles.ItemImagePlaceholder}
              src={imgfill}
            />
            <div className={styles.ItemInfo}>
              <div
                className={styles.ItemName + " " + styles.ItemNamePlaceholder}
              >
                Loading...
              </div>
              <div
                className={styles.ItemName + " " + styles.ItemNamePlaceholder}
              >
                Loading...
              </div>
              <div className={styles.ItemType}>
                <span>Item Type | Claim</span>
                <span className={styles.ItemIconPremiumTitle}>
                  <Currency />
                </span>
              </div>
              <div className={styles.ItemClaimDescription}>Description</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LedgerSkeleton;
