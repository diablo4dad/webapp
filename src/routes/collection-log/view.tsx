import EmptyCollection from "../../collection/EmptyCollection";
import ItemSidebar from "../../collection/ItemSidebar";
import ItemSidebarSkeleton from "../../collection/ItemSidebarSkeleton";
import Ledger from "../../collection/Ledger";
import LedgerSkeleton from "../../collection/LedgerSkeleton";
import Progress from "../../collection/Progress";
import Season from "../../collection/Season";
import Welcome from "../../collection/Welcome";
import type { Collection, CollectionItem } from "../../data";
import type { SidebarVisibility } from "../../common";
import { countAllItemsDabDb } from "../../data/aggregate";
import ConfigSidebar from "../../settings/ConfigSidebar";
import { CollectionLogLayout } from "./layout";
import styles from "./view.module.css";

type Props = {
  catalogError?: string;
  collections: Collection[];
  focusCollection?: Collection;
  focusItem: CollectionItem;
  isItemSidebarLoading: boolean;
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
  isItemSidebarLoading,
  isLoading,
  onClickItem,
  onCollectionChange,
  openCollections,
  sidebarVisibility,
}: Props) {
  return (
    <CollectionLogLayout
      hero={<Hero />}
      leftSidebar={
        sidebarVisibility.showItem ? (
          <ItemSidebarPanel
            focusCollection={focusCollection}
            focusItem={focusItem}
            isLoading={isItemSidebarLoading}
          />
        ) : undefined
      }
      rightSidebar={
        sidebarVisibility.showConfig ? <ConfigSidebarPanel /> : undefined
      }
      main={
        <MainContent
          catalogError={catalogError}
          collections={collections}
          isLoading={isLoading}
          onClickItem={onClickItem}
          onCollectionChange={onCollectionChange}
          openCollections={openCollections}
        />
      }
    ></CollectionLogLayout>
  );
}

function Hero() {
  return (
    <div className={styles.HeroLayout}>
      <Welcome />
      <Season />
      <Progress />
    </div>
  );
}

type ItemSidebarPanelProps = {
  focusCollection?: Collection;
  focusItem: CollectionItem;
  isLoading: boolean;
};

function ItemSidebarPanel({
  focusCollection,
  focusItem,
  isLoading,
}: ItemSidebarPanelProps) {
  return (
    <div className={styles.MainSidebarPanel}>
      {isLoading ? (
        <ItemSidebarSkeleton />
      ) : (
        <ItemSidebar collectionItem={focusItem} collection={focusCollection} />
      )}
    </div>
  );
}

function ConfigSidebarPanel() {
  return (
    <div className={styles.Sidebar}>
      <ConfigSidebar />
    </div>
  );
}

type MainContentProps = {
  catalogError?: string;
  collections: Collection[];
  isLoading: boolean;
  onClickItem: (collectionItem: CollectionItem, collection: Collection) => void;
  onCollectionChange: (collectionId: string, isOpen: boolean) => void;
  openCollections: string[];
};

function MainContent({
  catalogError,
  collections,
  isLoading,
  onClickItem,
  onCollectionChange,
  openCollections,
}: MainContentProps) {
  return (
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
  );
}
