import { useState } from "react";
import {Collection, Item, ItemType, StrapiHit, StrapiResultSet} from "./db";
import ItemView from "./ItemView";
import styles from "./Ledger.module.css";
import LedgerItem from "./LedgerItem";
import {Store} from "./Store";

type Props = {
  db: StrapiResultSet<Collection>,
  store: Store,
  onClickItem: (item: StrapiHit<Item>) => void,
  onDoubleClickItem: (item: StrapiHit<Item>) => void,
}

function Ledger({ db, store, onClickItem, onDoubleClickItem }: Props) {
  const isCollected = (entry: StrapiHit<Item>) => store.isCollected(entry.id);
  // const filterByType = (itemType: ItemType) => (item: StrapiHit<Item>) => item.attributes.itemType === itemType;
  // const itemTypes = Object.values(ItemType);
  // const countByItemType = (itemType: ItemType) => db.data.filter(filterByType(itemType)).length;
  // const collectedByItemType = (itemType: ItemType) => db
  //   .data
  //   .filter(filterByType(itemType))
  //   .map(item => item.id)
  //   .map(store.getLogEntry)
  //   .filter(logEntry => logEntry.collected)
  //   .length;

  return (
    <>
      {db.data.map((collection) => {
        return (
          <div key={collection.id}>
      <h1 className={styles.LedgerHeading}>{collection.attributes.name}</h1>
      <span className={styles.LedgerCounter}>
                 {/*[{collectedByItemType(itemType)}/{countByItemType(itemType)}]*/}
              </span>
      <div className={styles.LedgerRow}>
        {(collection.attributes.items?.data ?? []).map(item =>
                <LedgerItem
                    key={item.id}
                    data={item}
                    isCollected={isCollected(item)}
                    onClick={() => onClickItem(item)}
                    onDoubleClick={() => onDoubleClickItem(item)}
                />
            )
        }
      </div>
      </div>
    )
      })}
    </>
  )
}

export default Ledger;
