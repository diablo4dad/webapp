import { DEFAULT_COLLECTION_ITEM } from "../data";
import styles from "./item-sidebar.module.css";
import { ItemSidebar } from "./view";

function ItemSidebarSkeleton() {
  return (
    <ItemSidebar
      className={styles.Skeleton}
      collectionItem={DEFAULT_COLLECTION_ITEM}
    />
  );
}

export { ItemSidebarSkeleton };
