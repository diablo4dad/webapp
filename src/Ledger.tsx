import {Item, ItemType} from "./db";
import ItemView from "./ItemView";
import styles from "./Ledger.module.css";
import LedgerItem from "./LedgerItem";
import {Store} from "./Store";

type Props = {
  db: Item[],
  store: Store,
}

const Headings = {
  [ItemType.Mount]: "Mounts",
  [ItemType.MountArmor]: "Mount Armor",
  [ItemType.MountTrophy]: "Mount Trophies",
}

function Ledger({ db, store }: Props) {
  const isCollected = (entry: Item) => store.isCollected(entry.id);
  const toggle = (entry: Item) => () => store.toggle(entry.id);
  const filterByType = (itemType: ItemType) => (item: Item) => item.type === itemType;
  const itemTypes = Object.values(ItemType);
  const countByItemType = (itemType: ItemType) => db.filter(filterByType(itemType)).length;
  const collectedByItemType = (itemType: ItemType) => db
    .filter(filterByType(itemType))
    .map(item => item.id)
    .map(store.getLogEntry)
    .filter(logEntry => logEntry.collected)
    .length;
  const selectedItemId = db[0]?.id ?? 'none';
  const selectedItem = db.filter(item => item.id === selectedItemId).pop();

  return (
    <div>
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
                    onClick={toggle(item)}
                  />
                )
              }
            </div>
          </div>
        )
      })}
      {selectedItem && <ItemView item={selectedItem}></ItemView>}
    </div>
  )
}

export default Ledger;
