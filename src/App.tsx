import React, {useEffect, useState} from 'react';
import fetchDb, {
    Collection,
    createEmptyResultSet,
    getDefaultItemIdForCollection,
    Item,
    StrapiHit,
    StrapiResultSet,
} from "./db"
import logo from "./d4ico.png"

import styles from './App.module.css';
import Ledger from "./Ledger";
import useStore, {ItemFlag, Store} from "./Store";
import ItemSidebar from './ItemSidebar';
import ConfigSidebar, {Configuration, DEFAULT_CONFIG} from "./ConfigSidebar";
import {D4_BUILD, SITE_VERSION} from "./config";

enum SideBarType {
    ITEM = 'item',
    CONFIG = 'config'
}

enum ItemGroup {
    MOUNTS = "mounts",
    HORSE_ARMOR = "horse_armor",
    TROPHIES = "trophies",
    ARMOR = "armor",
    WEAPONS = "weapons",
}

const itemGroups = new Map([
    [ItemGroup.MOUNTS, ["Mount"]],
    [ItemGroup.HORSE_ARMOR, ["Horse Armor"]],
    [ItemGroup.TROPHIES, ["Trophy", "Back Trophy"]],
    [ItemGroup.WEAPONS, ["Axe", "Dagger", "Focus", "Mace", "Scythe", "Shield", "Sword", "Totem", "Wand", "Two-Handed Axe", "Bow", "Crossbow", "Two-Handed Mace", "Polearm", "Two-Handed Scythe", "Staff", "Two-Handed Sword"]],
    [ItemGroup.ARMOR, ["Chest Armor", "Boots", "Gloves", "Helm", "Pants"]]
]);

// references:
// https://www.thegamer.com/diablo-4-all-mount-trophies-unlock-guide/#diablo-4-all-pve-mount-trophies
// https://www.wowhead.com/diablo-4/guide/gameplay/all-mounts-appearances-sources
// https://www.reddit.com/r/diablo4/comments/17d68kq/ultimate_fomo_guide_2_all_d4_events_and_promotions/?rdt=39151

// disable console logging in prod
if (process.env.NODE_ENV === 'production') {
    console.log = function () {
        return;
    };
}

function selectRandomItem(items: StrapiHit<Item>[]): StrapiHit<Item> | undefined {
    return items[Math.floor(Math.random() * items.length)];
}

function reduceItems(db: StrapiResultSet<Collection>): StrapiHit<Item>[] {
    return db.data.flatMap(c => c.attributes.items?.data ?? [])
}

function filterCollectionItems(collection: StrapiResultSet<Collection>, filter: (data: StrapiHit<Item>) => boolean) {
    return {
        ...collection,
        data: collection.data.map(c => ({
            ...c,
            attributes: {
                ...c.attributes,
                items: {
                    ...c.attributes.items,
                    data: (c.attributes.items?.data ?? []).filter(filter),
                }
            }
        }))
    }
}

function filterItemsByType(itemTypesToDisplay: string[]): (item: StrapiHit<Item>) => boolean {
    return (item: StrapiHit<Item>) => itemTypesToDisplay.includes(item.attributes.itemType);
}

function filterPremiumItems(): (item: StrapiHit<Item>) => boolean {
    return (item: StrapiHit<Item>) => item.attributes.premium !== true;
}

function filterPromotionalItems(): (item: StrapiHit<Item>) => boolean {
    return (item: StrapiHit<Item>) => item.attributes.promotional !== true;
}

function filterOutOfRotationItems(): (item: StrapiHit<Item>) => boolean {
    return (item: StrapiHit<Item>) => item.attributes.outOfRotation !== true;
}

function filterHiddenItems(store: Store): (item: StrapiHit<Item>) => boolean {
    return (item: StrapiHit<Item>) => !store.isHidden(item.id);
}

function aggregateItemTypes(config: Configuration): string[] {
    return Array<string>()
        .concat(config.showMounts ? itemGroups.get(ItemGroup.MOUNTS) ?? [] : [])
        .concat(config.showHorseArmor ? itemGroups.get(ItemGroup.HORSE_ARMOR) ?? [] : [])
        .concat(config.showTrophies ? itemGroups.get(ItemGroup.TROPHIES) ?? [] : [])
        .concat(config.showArmor ? itemGroups.get(ItemGroup.ARMOR) ?? [] : [])
        .concat(config.showWeapons ? itemGroups.get(ItemGroup.WEAPONS) ?? [] : []);
}

function selectItemOrDefault(items: StrapiHit<Item>[], selectedItemId: number): StrapiHit<Item> | undefined {
    return items.filter(i => i.id === selectedItemId).pop() ?? selectRandomItem(items);
}

function filterDb(collection: StrapiResultSet<Collection>, store: Store, config: Configuration): StrapiResultSet<Collection> {
    let c = filterCollectionItems(collection, filterItemsByType(aggregateItemTypes(config)));

    if (!config.showPremium) {
        c = filterCollectionItems(c, filterPremiumItems());
    }

    if (!config.showOutOfRotation) {
        c = filterCollectionItems(c, filterOutOfRotationItems());
    }

    if (!config.showPromotional) {
        c = filterCollectionItems(c, filterPromotionalItems());
    }

    if (!config.showHidden) {
        c = filterCollectionItems(c, filterHiddenItems(store));
    }

    return c;
}

function App() {
    // deps
    const store = useStore();

    // references
    const [db, setDb] = useState(createEmptyResultSet<Collection>());
    const [selectedItemId, setSelectedItemId] = useState(getDefaultItemIdForCollection(db));
    const [sideBar, setSideBar] = useState(SideBarType.ITEM);
    const [config, setConfig] = useState<Configuration>(store.loadConfig() ?? DEFAULT_CONFIG);

    // computed properties
    const items = reduceItems(db);
    const selectedItem = selectItemOrDefault(items, selectedItemId);
    const filteredDb = filterDb(db, store, config);

    function onToggleConfig() {
        setSideBar(sideBar === SideBarType.CONFIG ? SideBarType.ITEM : SideBarType.CONFIG);
    }

    function onClickItem(item: StrapiHit<Item>) {
        setSelectedItemId(item.id);
        setSideBar(SideBarType.ITEM);
    }

    function onDoubleClickItem(item: StrapiHit<Item>) {
        store.toggle(item.id);
    }

    function onConfigChange(config: Configuration) {
        store.saveConfig(config);
        setConfig(config);
    }

    function getConfigBtnClasses() {
        return styles.AppSettingsBtn + (sideBar === 'config' ? ' ' + styles.AppSettingsBtnPressed : '');
    }

    useEffect(() => {
        fetchDb()
            .then(data => {
                console.log("DB Initialised...", data);

                if (Array.isArray(data.data)) {
                    setDb(data);
                }
            });
    }, [setDb]);

    return (
        <div className={styles.App}>
            <section className={styles.AppContent}>
                <div className={styles.AppSideBar}>
                    <div>
                        <header className={styles.AppHeader}>
                            <div className={styles.AppIconHolder}>
                                <img className={styles.AppIcon} src={logo} alt="Diablo 4"/>
                            </div>
                            <div className={styles.AppNameHolder}>
                                <div className={styles.AppName}>Diablo IV Collection Log</div>
                                <div className={styles.AppTagLine}>Bringing closure to the completionist in you.</div>
                            </div>
                            <div className={styles.AppSettings}>
                                <button className={getConfigBtnClasses()} onClick={onToggleConfig}>
                                    <svg
                                        viewBox="0 -256 1792 1792"
                                        width="100%"
                                        height="100%">
                                        <g
                                            transform="matrix(1,0,0,-1,121.49153,1285.4237)"
                                            id="g3027">
                                            <path
                                                d="m 1024,640 q 0,106 -75,181 -75,75 -181,75 -106,0 -181,-75 -75,-75 -75,-181 0,-106 75,-181 75,-75 181,-75 106,0 181,75 75,75 75,181 z m 512,109 V 527 q 0,-12 -8,-23 -8,-11 -20,-13 l -185,-28 q -19,-54 -39,-91 35,-50 107,-138 10,-12 10,-25 0,-13 -9,-23 -27,-37 -99,-108 -72,-71 -94,-71 -12,0 -26,9 l -138,108 q -44,-23 -91,-38 -16,-136 -29,-186 -7,-28 -36,-28 H 657 q -14,0 -24.5,8.5 Q 622,-111 621,-98 L 593,86 q -49,16 -90,37 L 362,16 Q 352,7 337,7 323,7 312,18 186,132 147,186 q -7,10 -7,23 0,12 8,23 15,21 51,66.5 36,45.5 54,70.5 -27,50 -41,99 L 29,495 Q 16,497 8,507.5 0,518 0,531 v 222 q 0,12 8,23 8,11 19,13 l 186,28 q 14,46 39,92 -40,57 -107,138 -10,12 -10,24 0,10 9,23 26,36 98.5,107.5 72.5,71.5 94.5,71.5 13,0 26,-10 l 138,-107 q 44,23 91,38 16,136 29,186 7,28 36,28 h 222 q 14,0 24.5,-8.5 Q 914,1391 915,1378 l 28,-184 q 49,-16 90,-37 l 142,107 q 9,9 24,9 13,0 25,-10 129,-119 165,-170 7,-8 7,-22 0,-12 -8,-23 -15,-21 -51,-66.5 -36,-45.5 -54,-70.5 26,-50 41,-98 l 183,-28 q 13,-2 21,-12.5 8,-10.5 8,-23.5 z"
                                                id="path3029"/>
                                        </g>
                                    </svg>
                                </button>
                            </div>
                        </header>
                        {sideBar === SideBarType.ITEM && selectedItem &&
                            <ItemSidebar
                                item={selectedItem}
                                hidden={store.isHidden(selectedItemId)}
                                collected={store.isCollected(selectedItemId)}
                                onClickCollected={() => store.toggle(selectedItemId, ItemFlag.COLLECTED)}
                                onClickHidden={() => store.toggle(selectedItemId, ItemFlag.HIDDEN)}
                            ></ItemSidebar>
                        }
                        {sideBar === SideBarType.CONFIG &&
                            <ConfigSidebar
                                config={config}
                                onChange={onConfigChange}
                            ></ConfigSidebar>
                        }
                    </div>
                </div>
                <div className={styles.AppContentMain}>
                    <Ledger
                        db={filteredDb}
                        store={store}
                        onClickItem={onClickItem}
                        onDoubleClickItem={onDoubleClickItem}
                        view={config.view}
                    ></Ledger>
                </div>
            </section>
            <footer className={styles.AppFooter}>
                <div className={styles.AppFooterItem}>Site Version: <code>{SITE_VERSION}</code></div>
                {/*<div className={styles.AppFooterItem}>Game Version: <code>{D4_BUILD}</code></div>*/}
                <div className={styles.AppFooterItem}>
                    Not Affiliated with Activision Blizzard, Inc.<br></br>
                    This is a fan-site built by fans, for fans.
                </div>
                <div className={styles.AppFooterItem}><a href="https://discord.gg/hWMTQcbE">Get in touch</a></div>
            </footer>
        </div>
    );
}

export default App;
