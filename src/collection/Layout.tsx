import React, { useState } from "react";
import { toggleValueInArray } from "../common/arrays";
import { CollectionItem } from "../data";
import { countAllItemsDabDb } from "../data/aggregate";
import { useData } from "../data/context";
import { selectItemOrDefault } from "../data/reducers";
import { ViewModel } from "../routes/CollectionLog";
import { getViewModel, saveViewModel } from "../store/local";
import EmptyCollection from "./EmptyCollection";
import ItemSidebar from "./ItemSidebar";
import Ledger from "./Ledger";
import styles from "./Layout.module.css";

export function Layout() {
  const { filteredDb, db, setFocusItemId, focusItemId } = useData();
  const [vm, setVm] = useState<ViewModel>(getViewModel());
  const focusItem = selectItemOrDefault(db.collections, focusItemId);

  saveViewModel(vm);

  function onClickItem(collectionItem: CollectionItem) {
    setFocusItemId(collectionItem.id);
  }

  return (
    <div className={styles.Content}>
      <div className={styles.Sidebar}>
        <ItemSidebar collectionItem={focusItem} />
      </div>
      <div className={styles.Main}>
        <Ledger
          collections={filteredDb}
          openCollections={vm.openCollections}
          onClickItem={onClickItem}
          onCollectionChange={(collectionId, isOpen) => {
            setVm((vm) => ({
              ...vm,
              openCollections: toggleValueInArray(
                vm.openCollections,
                collectionId,
                isOpen,
              ),
            }));
          }}
        />
        {countAllItemsDabDb(filteredDb) === 0 && <EmptyCollection />}
      </div>
    </div>
  );
}
