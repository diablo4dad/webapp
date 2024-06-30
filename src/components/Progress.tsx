import styles from "./Progress.module.css";

type Props = {
  totalCollected: number;
  collectionSize: number;
};

function Progress({ totalCollected, collectionSize }: Props) {
  const percentage = Math.min(
    Math.floor((totalCollected / collectionSize) * 100),
    100,
  );

  return (
    <div className={styles.Progress}>
      <div className={styles.ProgressBar}>
        <span
          className={styles.ProgressBarFill}
          style={{ width: "max(" + percentage + "%" + ", 3rem)" }}
        >
          {percentage + "%"}
        </span>
      </div>
      <div className={styles.ProgressTicker}>
        <div className={styles.ProgressLabel}>Your Collection</div>
        <div className={styles.ProgressTickerText}>
          {totalCollected} / {collectionSize}
        </div>
      </div>
    </div>
  );
}

export default Progress;
