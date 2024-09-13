import styles from "./EmptyCollection.module.css";

function EmptyCollection() {
  return (
    <div className={styles.Empty}>
      <h1 className={styles.Heading}>So much empty&hellip;</h1>
      <p>Try loosening the filters and/or providing a broader search term.</p>
    </div>
  );
}

export default EmptyCollection;
