import styles from "./empty-state.module.css";

function EmptyState() {
  return (
    <div className={styles.EmptyState}>
      <h1 className={styles.EmptyStateHeading}>So much empty&hellip;</h1>
      <p>Try loosening the filters and/or providing a broader search term.</p>
    </div>
  );
}

export default EmptyState;
