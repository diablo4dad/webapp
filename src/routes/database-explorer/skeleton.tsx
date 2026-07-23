import {
  ItemListSkeleton,
} from "../../features/database-explorer/item-list";
import {
  ItemViewSkeleton,
} from "../../features/database-explorer/item-view";
import { Layout } from "./layout";
import styles from "./skeleton.module.css";

function DatabaseExplorerSkeleton() {
  return (
    <Layout isListPaneVisible={true}>
      <section
        data-database-results-pane
        className={styles.SkeletonResultsPane}
        role="status"
        aria-busy="true"
        aria-label="Loading database"
      >
        <div aria-hidden="true">
          <ItemListSkeleton />
        </div>
      </section>
      <section className={styles.SkeletonItemPane} aria-hidden="true">
        <ItemViewSkeleton />
      </section>
    </Layout>
  );
}

export { DatabaseExplorerSkeleton };
