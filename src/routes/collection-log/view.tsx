import EmptyCollection from "../../collection/EmptyCollection";
import Welcome from "../../collection/Welcome";
import ItemSidebar from "../../collection/ItemSidebar";
import ItemSidebarSkeleton from "../../collection/ItemSidebarSkeleton";
import Progress from "../../collection/Progress";
import Season from "../../collection/Season";
import ConfigSidebar from "../../settings/ConfigSidebar";
import styles from "./route.module.css";
import Ledger from "../../collection/Ledger";
import LedgerSkeleton from "../../collection/LedgerSkeleton";
import { Collection, CollectionItem } from "../../data";
import type { SidebarVisibility } from "../../common";
import { countAllItemsDabDb } from "../../data/aggregate";
import { CollectionLogLayout } from "./layout";

type Props = {
  catalogError?: string;
  collections: Collection[];
  focusCollection?: Collection;
  focusItem: CollectionItem;
  focusItemId: number;
  isLoading: boolean;
  onClickItem: (collectionItem: CollectionItem, collection: Collection) => void;
  onCollectionChange: (collectionId: string, isOpen: boolean) => void;
  openCollections: string[];
  sidebarVisibility: SidebarVisibility;
};

export function CollectionLogView({
  catalogError,
  collections,
  focusCollection,
  focusItem,
  focusItemId,
  isLoading,
  onClickItem,
  onCollectionChange,
  openCollections,
  sidebarVisibility,
}: Props) {
  return (
    <CollectionLogLayout
      hero={
        <div className={styles.HeroLayout}>
          <Welcome />
          <Season />
          <Progress />
        </div>
      }
      leftSidebar={
        sidebarVisibility.showItem ? (
          <div className={styles.MainSidebarPanel}>
            {focusItemId === -1 ? (
              <ItemSidebarSkeleton />
            ) : (
              <ItemSidebar
                collectionItem={focusItem}
                collection={focusCollection}
              />
            )}
          </div>
        ) : undefined
      }
      rightSidebar={
        sidebarVisibility.showConfig ? (
          <div className={styles.Sidebar}>
            <ConfigSidebar />
          </div>
        ) : undefined
      }
      main={
        <div className={styles.Content}>
          {isLoading ? (
            <LedgerSkeleton />
          ) : catalogError ? (
            <div className={styles.LoadError}>{catalogError}</div>
          ) : (
            <>
              <Ledger
                collections={collections}
                openCollections={openCollections}
                onClickItem={onClickItem}
                onCollectionChange={onCollectionChange}
              />
              {countAllItemsDabDb(collections) === 0 && <EmptyCollection />}
            </>
          )}
        </div>
      }
    ></CollectionLogLayout>
  );
}
