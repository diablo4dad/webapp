import { useState } from "react";
import {Item, ItemType, StrapiHit, StrapiResultSet} from "./db";
import ItemView from "./ItemView";
import styles from "./Ledger.module.css";
import LedgerItem from "./LedgerItem";
import {Store} from "./Store";

type Props = {
  db: StrapiResultSet<Item>,
  store: Store,
  onClickItem: (item: StrapiHit<Item>) => void,
  onDoubleClickItem: (item: StrapiHit<Item>) => void,
}

const Headings = {
  [ItemType.Mount]: "Mounts",
  [ItemType.MountArmor]: "Mount Armor",
  [ItemType.MountTrophy]: "Mount Trophies",
  [ItemType.BackTrophy]: "Back Trophies"
}

function Ledger({ db, store, onClickItem, onDoubleClickItem }: Props) {
  const isCollected = (entry: StrapiHit<Item>) => store.isCollected(entry.id);
  const filterByType = (itemType: ItemType) => (item: StrapiHit<Item>) => item.attributes.itemType === itemType;
  const itemTypes = Object.values(ItemType);
  const countByItemType = (itemType: ItemType) => db.data.filter(filterByType(itemType)).length;
  const collectedByItemType = (itemType: ItemType) => db
    .data
    .filter(filterByType(itemType))
    .map(item => item.id)
    .map(store.getLogEntry)
    .filter(logEntry => logEntry.collected)
    .length;
  const collections = db.data.reduce((r, c) => {
    const n = c.attributes.collection.data.attributes.name;
    r[n] = r[n] || [];
    r[n].push(c);
    return r;
  }, {} as {[key: string]: StrapiHit<Item>[]});

  console.log("Sorted Collections", collections);

  return (
    <>
      {Object.entries(collections).map(([collectionName, items]) => {
        return (
          <div key={collectionName}>
      <h1 className={styles.LedgerHeading}>
        {collectionName}
      </h1>
      <span className={styles.LedgerCounter}>
                 {/*[{collectedByItemType(itemType)}/{countByItemType(itemType)}]*/}
              </span>
      <div className={styles.LedgerRow}>
        {items
            // .filter(filterByType(itemType))
            .map(item =>
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
