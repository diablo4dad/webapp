import ItemSidebar from "./ItemSidebar";
import { DEFAULT_COLLECTION_ITEM } from "../data";
import styles from "./ItemSidebar.module.css";

function ItemSidebarSkeleton() {
  return (
    <ItemSidebar
      className={styles.Skeleton}
      collectionItem={DEFAULT_COLLECTION_ITEM}
    />
  );
}

export default ItemSidebarSkeleton;
