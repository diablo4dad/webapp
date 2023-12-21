import { useState } from "react";
import {Item, ItemType} from "./db";
import ItemView from "./ItemView";
import styles from "./Ledger.module.css";
import LedgerItem from "./LedgerItem";
import {Store} from "./Store";

type Props = {
  db: Item[],
  store: Store,
  onClickItem: (item: Item) => void,
  onDoubleClickItem: (item: Item) => void,
}

const Headings = {
  [ItemType.Mount]: "Mounts",
  [ItemType.MountArmor]: "Mount Armor",
  [ItemType.MountTrophy]: "Mount Trophies",
  [ItemType.BackTrophy]: "Back Trophies"
}

function Ledger({ db, store, onClickItem, onDoubleClickItem }: Props) {
  const isCollected = (entry: Item) => store.isCollected(entry.id);
  const filterByType = (itemType: ItemType) => (item: Item) => item.type === itemType;
  const itemTypes = Object.values(ItemType);
  const countByItemType = (itemType: ItemType) => db.filter(filterByType(itemType)).length;
  const collectedByItemType = (itemType: ItemType) => db
    .filter(filterByType(itemType))
    .map(item => item.id)
    .map(store.getLogEntry)
    .filter(logEntry => logEntry.collected)
    .length;

  return (
    <>
      {itemTypes.map(itemType => {
        return (
          <div key={itemType}>
            <h1 className={styles.LedgerHeading}>
              {Headings[itemType] ?? "missing"}
            </h1>
            <span className={styles.LedgerCounter}>
               [{collectedByItemType(itemType)}/{countByItemType(itemType)}]
            </span>
            <div className={styles.LedgerRow}>
              {db
                .filter(filterByType(itemType))
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
