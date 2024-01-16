import {composeDescription, Item, StrapiHit} from "./db"
import styles from "./ItemSidebar.module.css"
import necromancer from "./necromancer.webp"
import druid from "./druid.webp"
import rogue from "./rogue.webp"
import barbarian from "./barbarian.webp"
import sorceress from "./sorceress.webp"
import Toggle from "./Toggle";
import {getImageUri, SERVER_ADDR} from "./config";

function generateEditUrl(item: StrapiHit<Item>): string {
    return SERVER_ADDR + "/admin/content-manager/collectionType/api::item.item/" + item.id;
}

function usableBy(clazz: string, item: StrapiHit<Item>): boolean {
    return item.attributes.usableByClass.includes(clazz);
}

type ItemProps = {
    item: StrapiHit<Item>,
    collected: boolean,
    hidden: boolean,
    onClickCollected: (collected: boolean) => void,
    onClickHidden: (hidden: boolean) => void,
}

function ItemSidebar({item, collected, hidden, onClickCollected, onClickHidden}: ItemProps) {
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
                        <div className={styles.ItemLocationDescription}>{composeDescription(item.attributes)}</div>
                        <div className={styles.ItemLocationCategory}>{item.attributes.claim}</div>
                    </div>
                </div>
            </div>
            <div className={styles.ItemTags}>
                {item.attributes.season != null && <span className={styles.ItemTag}>Season {item.attributes.season}</span>}
                {item.attributes.premium && <span className={styles.ItemTag}>Premium</span>}
                {item.attributes.outOfRotation && <span className={styles.ItemTag}>Out of Rotation</span>}
            </div>
            <div className={styles.ItemMeta}>
                Item ID: {item.attributes.itemId}
                {process.env.NODE_ENV === "development" && <span> | <a href={generateEditUrl(item)} target="_blank">Edit</a></span>}
                {process.env.NODE_ENV === "development" && <span> | Icon ID: {item.attributes.iconId}</span>}
            </div>
        </div>
    );
}

export default ItemSidebar
