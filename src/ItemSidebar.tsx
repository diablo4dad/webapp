import {CollectionItem, composeDescription, Item, StrapiHit} from "./db"
import styles from "./ItemSidebar.module.css"
import necromancer from "./ gfx/necromancer.webp"
import druid from "./ gfx/druid.webp"
import rogue from "./ gfx/rogue.webp"
import barbarian from "./ gfx/barbarian.webp"
import sorceress from "./ gfx/sorceress.webp"
import Toggle from "./Toggle";
import {getDefaultItemFromCollectionItems, getImageUri, SERVER_ADDR} from "./config";

function generateEditUrl(item: StrapiHit<Item>): string {
    return SERVER_ADDR + "/admin/content-manager/collectionType/api::item.item/" + item.id;
}

function usableBy(clazz: string, item: StrapiHit<Item>): boolean {
    return item.attributes.usableByClass.includes(clazz);
}

type ItemProps = {
    collectionItem: StrapiHit<CollectionItem>,
    collected: boolean,
    hidden: boolean,
    onClickCollected: (collected: boolean) => void,
    onClickHidden: (hidden: boolean) => void,
}

function ItemSidebar({collectionItem, collected, hidden, onClickCollected, onClickHidden}: ItemProps) {
    const item = getDefaultItemFromCollectionItems(collectionItem);
    if (!item) {
        return null;
    }

    return (
        <div className={styles.Panel}>
            <img src={getImageUri(item)} className={styles.ItemImage} alt={item.attributes.name}/>
            <div className={styles.ItemTitle}>{item.attributes.name}</div>
            <div className={styles.ItemType}>{item.attributes.itemType}</div>
            <div className={styles.ItemClasses}>
                {usableBy("Barbarian", item) &&
                    <img className={styles.ItemClassIcon} src={barbarian} alt="Barbarian"/>}
                {usableBy("Druid", item) &&
                    <img className={styles.ItemClassIcon} src={druid} alt="Druid"/>}
                {usableBy("Necromancer", item) &&
                    <img className={styles.ItemClassIcon} src={necromancer} alt="Necromancer"/>}
                {usableBy("Rogue", item) &&
                    <img className={styles.ItemClassIcon} src={rogue} alt="Rogue"/>}
                {usableBy("Sorceress", item) &&
                    <img className={styles.ItemClassIcon} src={sorceress} alt="Sorceress"/>}
            </div>
            <div className={styles.ItemDescription} hidden={!item.attributes.description || true}>{item.attributes.description}</div>
            <div className={styles.ItemActions}>
                <Toggle name="collected" checked={collected} onChange={e => onClickCollected(e.target.checked)}>Collected</Toggle>
                <Toggle name="hidden" checked={hidden} onChange={e => onClickHidden(e.target.checked)}>Hidden</Toggle>
            </div>
            <div className={styles.ItemLocations}>
                <div className={styles.ItemLocation}>
                    <div className={styles.ItemLocationInfo}>
                        <div className={styles.ItemLocationDescription}>{composeDescription(collectionItem.attributes)}</div>
                        <div className={styles.ItemLocationCategory}>{collectionItem.attributes.claim}</div>
                    </div>
                </div>
            </div>
            <div className={styles.ItemTags}>
                {collectionItem.attributes.season != null && <span className={styles.ItemTag}>Season {collectionItem.attributes.season}</span>}
                {collectionItem.attributes.premium && <span className={styles.ItemTag}>Premium</span>}
                {collectionItem.attributes.outOfRotation && <span className={styles.ItemTag}>Out of Rotation</span>}
            </div>
            <div className={styles.ItemMeta}>
                <div>
                    Item ID: {item.attributes.itemId}
                    {process.env.NODE_ENV === "development" && <span> | <a href={generateEditUrl(item)} target="_blank">Edit</a></span>}
                </div>
                {process.env.NODE_ENV === "development" && <div>Image ID: {item.attributes.iconId}</div>}
            </div>
        </div>
    );
}

export default ItemSidebar
