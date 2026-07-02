import styles from "./skeleton.module.css";

function Skeleton() {
  return (
    <div className={styles.Skeleton}>
      {Array.from({ length: 5 }, (_, k) => (
        <div className={styles.SkeletonHeader} key={k}>
          <div className={styles.SkeletonButton}>
            <div>
              <h1 className={styles.SkeletonTitle}>
                <span>{"Loading... Loading..."}</span>
              </h1>
              <div className={styles.SkeletonDescription}>
                <span>
                  {"Loading... Loading... Loading... Loading... Loading..."}
                </span>
              </div>
            </div>
            <span className={styles.SkeletonActions}>
              <span />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
