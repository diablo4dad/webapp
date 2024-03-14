import {composeDescription, DadCollectionItem, getAggregatedItemName, getAggregatedItemType} from "./db"
import styles from "./ItemSidebar.module.css"
import necromancer from "./image/necromancer.webp"
import druid from "./image/druid.webp"
import rogue from "./image/rogue.webp"
import barbarian from "./image/barbarian.webp"
import sorceress from "./image/sorceress.webp"
import Toggle from "./Toggle";
import {getDefaultItemFromCollectionItems, getImageUri, SERVER_ADDR} from "./config";

function generateEditUrl(item: DadCollectionItem): string {
    return SERVER_ADDR + "/admin/content-manager/collectionType/api::collection-item.collection-item/" + item.strapiId;
}

function usableBy(clazz: string, dci: DadCollectionItem): boolean {
    return dci.items.some(di => di.usableByClass.includes(clazz));
}

type ItemProps = {
    collectionItem: DadCollectionItem,
    collected: boolean,
    hidden: boolean,
    onClickCollected: (collected: boolean) => void,
    onClickHidden: (hidden: boolean) => void,
}

function ItemSidebar({collectionItem, collected, hidden, onClickCollected, onClickHidden}: ItemProps) {
    const item = getDefaultItemFromCollectionItems(collectionItem);

    return (
        <div className={styles.Panel}>
            <img src={getImageUri(item)} className={styles.ItemImage} alt={item.name}/>
            <div className={styles.ItemTitle}>{getAggregatedItemName(collectionItem)}</div>
            <div className={styles.ItemType}>{getAggregatedItemType(collectionItem)}</div>
            <div className={styles.ItemClasses}>
                {usableBy("Barbarian", collectionItem) &&
                    <img className={styles.ItemClassIcon} src={barbarian} alt="Barbarian"/>}
                {usableBy("Druid", collectionItem) &&
                    <img className={styles.ItemClassIcon} src={druid} alt="Druid"/>}
                {usableBy("Necromancer", collectionItem) &&
                    <img className={styles.ItemClassIcon} src={necromancer} alt="Necromancer"/>}
                {usableBy("Rogue", collectionItem) &&
                    <img className={styles.ItemClassIcon} src={rogue} alt="Rogue"/>}
                {usableBy("Sorcerer", collectionItem) &&
                    <img className={styles.ItemClassIcon} src={sorceress} alt="Sorcerer"/>}
            </div>
            <div className={styles.ItemDescription} hidden={!item.description || true}>{item.description}</div>
            <div className={styles.ItemActions}>
                <Toggle name="collected" checked={collected} onChange={e => onClickCollected(e.target.checked)}>Collected</Toggle>
                <Toggle name="hidden" checked={hidden} onChange={e => onClickHidden(e.target.checked)}>Hidden</Toggle>
            </div>
            <div className={styles.ItemLocations}>
                <div className={styles.ItemLocation}>
                    <div className={styles.ItemLocationInfo}>
                        <div className={styles.ItemLocationDescription}>{composeDescription(collectionItem)}</div>
                        <div className={styles.ItemLocationCategory}>{collectionItem.claim}</div>
                    </div>
                </div>
            </div>
            <div className={styles.ItemTags}>
                {collectionItem.season != null && <span className={styles.ItemTag}>Season {collectionItem.season}</span>}
                {collectionItem.premium && <span className={styles.ItemTag}>Premium</span>}
                {collectionItem.outOfRotation && <span className={styles.ItemTag}>Out of Rotation</span>}
            </div>
            <div className={styles.ItemMeta}>
                <div>
                    Item ID: {collectionItem.items.map(i => i.itemId).join(' | ')}
                    {process.env.NODE_ENV === "development" && <span> | <a href={generateEditUrl(collectionItem)} target="_blank">Edit</a></span>}
                </div>
                {process.env.NODE_ENV === "development" && <div>Image ID: {item.iconId}</div>}
            </div>
        </div>
    );
}

export default ItemSidebar
