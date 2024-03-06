import styles from "./Ledger.module.css";
import React from "react";
import {Currency} from "./Icons";
import imgfill from "./image/imgfill.png"

type Props = {
    view: 'list' | 'card',
    numItems: number,
}

function LedgerSkeleton({ view, numItems = 3 }: Props) {
    return (
        <div className={styles.LedgerGroup + ' ' + (view === 'card' ? styles.LedgerCardView : '')}>
            <div className={styles.LedgerGroupHeading}>
                <div className={styles.LedgerHeading + ' ' + styles.LedgerHeadingPlaceholder}>Loading...</div>
                <div className={styles.LedgerDescription + ' ' + styles.LedgerDescriptionPlaceholder}>Loading Loading Loading...</div>
            </div>
            <div className={styles.LedgerRow}>
            {new Array(numItems).fill(0).map((_, k) =>
                <div className={styles.Artifact} key={k}>
                    <img className={styles.ArtifactImage + ' ' + styles.ArtifactImagePlaceholder} src={imgfill}/>
                    <div className={styles.ArtifactInfo}>
                        <div className={styles.ArtifactName + ' ' + styles.ArtifactNamePlaceholder}>Loading...</div>
                        <div className={styles.ArtifactName + ' ' + styles.ArtifactNamePlaceholder}>Loading...</div>
                        <div className={styles.ArtifactItemType}>
                            <span>Item Type | Claim</span>
                            <span className={styles.ArtifactIconPremiumTitle}>
                                <Currency/>
                            </span>
                        </div>
                        <div className={styles.ArtifactClaimDescription}>Description</div>
                    </div>
                </div>
            )}
            </div>
        </div>
    )
}

export default LedgerSkeleton;
