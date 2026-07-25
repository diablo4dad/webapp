import classNames from "classnames";
import {
  ItemListSkeleton,
} from "../../features/database-explorer/item-list";
import {
  ItemViewSkeleton,
} from "../../features/database-explorer/item-view";
import { Layout } from "./layout";
import styles from "./view.module.css";

function DatabaseSkeleton() {
  return (
    <Layout isListPaneVisible={true}>
      <section
        data-database-results-pane
        className={styles.ViewResultsPane}
        role="status"
        aria-busy="true"
        aria-label="Loading database"
      >
        <div aria-hidden="true">
          <ItemListSkeleton />
        </div>
      </section>
      <section
        className={classNames(
          styles.ViewItemPane,
          styles.ViewItemPaneMobileHidden,
        )}
        aria-hidden="true"
      >
        <ItemViewSkeleton />
      </section>
    </Layout>
  );
}

export { DatabaseSkeleton };
