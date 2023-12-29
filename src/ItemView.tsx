import {Item, StrapiHit} from "./db"
import styles from "./ItemView.module.css"
import necromancer from "./necromancer.webp"
import druid from "./druid.webp"
import rogue from "./rogue.webp"
import barbarian from "./barbarian.webp"
import sorceress from "./sorceress.webp"
import Toggle from "./Toggle";

type ItemProps = {
    item: StrapiHit<Item>,
    collected: boolean,
}

function ItemView({item, collected}: ItemProps) {
    const itemUrl = 'http://localhost:1337' + item.attributes.icon?.data?.attributes.url ?? 'missing.webp';

    return (
        <div className={styles.Panel}>
            <img src={itemUrl} className={styles.ItemImage} alt={item.attributes.name}/>
            <div className={styles.ItemTitle}>{item.attributes.name}</div>
            <div className={styles.ItemType}>{item.attributes.itemType}</div>
            <div className={styles.ItemClasses}>
                <img className={styles.ItemClassIcon} src={barbarian} alt="Necromancer"/>
                <img className={styles.ItemClassIcon} src={druid} alt="Druid"/>
                <img className={styles.ItemClassIcon} src={necromancer} alt="Necromancer"/>
                <img className={styles.ItemClassIcon} src={rogue} alt="Rogue"/>
                <img className={styles.ItemClassIcon} src={sorceress} alt="Sorceress"/>
            </div>
            <div className={styles.ItemDescription} hidden={!item.attributes.description || true}>{item.attributes.description}</div>
            <div className={styles.ItemActions}>
                <Toggle name="collected" checked={collected}>Collected</Toggle>
                <Toggle name="hidden" checked={collected}>Hidden</Toggle>
            </div>
            <div className={styles.ItemLocations}>
                <div className={styles.ItemLocation}>
                    <div className={styles.ItemLocationInfo}>
                        <div className={styles.ItemLocationDescription}>Dropped by Ashava the Pestilent.</div>
                        <div className={styles.ItemLocationCategory}>World Boss Drop</div>
                    </div>
                </div>
            </div>
            <div className={styles.ItemTags}>
                <span className={styles.ItemTag}>Season 2</span>
                <span className={styles.ItemTag}>Cash Shop</span>
            </div>
        </div>
    );
}

export default ItemView
