import type { ReactNode } from "react";
import styles from "./layout.module.css";

type Props = {
  header?: ReactNode;
  isLoading?: boolean;
  labelledBy?: string;
  main: ReactNode;
  mainLabel?: string;
};

function Layout({
  header,
  isLoading = false,
  labelledBy,
  main,
  mainLabel,
}: Props) {
  const dashboardClassName = header
    ? styles.LayoutDashboard
    : `${styles.LayoutDashboard} ${styles.LayoutDashboardFull}`;

  const content = (
    <section className={dashboardClassName} aria-labelledby={labelledBy}>
      {header && (
        <div className={styles.LayoutHeader}>
          {header}
        </div>
      )}
      <section className={styles.LayoutSection} aria-label={mainLabel}>
        {main}
      </section>
    </section>
  );

  return (
    <div className={styles.Layout}>
      <main className={styles.LayoutMain}>
        {isLoading
          ? (
              <section
                className={styles.LayoutStatus}
                role="status"
                aria-busy="true"
                aria-label="Loading stats"
              >
                <div aria-hidden="true">{content}</div>
              </section>
            )
          : content}
      </main>
    </div>
  );
}

export { Layout };
