import styles from './Progress.module.css'

type Props = {
    totalCollected: number,
    collectionSize: number,
}

function Progress({ totalCollected, collectionSize }: Props) {
    const percentage = Math.min(Math.floor((totalCollected / collectionSize) * 100), 100);

    return (
        <div className={styles.Progress}>
            <div className={styles.ProgressBar}>
                <span className={styles.ProgressBarFill} style={{width: Math.max(percentage, 6) + '%'}}>
                    {percentage + '%'}
                </span>
            </div>
            <div className={styles.ProgressTicker}>
                <span className={styles.ProgressTickerText}>{totalCollected} / {collectionSize}</span>
            </div>
        </div>
    );
}

export default Progress;
