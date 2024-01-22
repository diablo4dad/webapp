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
import {DISCORD_INVITE_LINK, LAST_UPDATED, SITE_VERSION} from "./config";
import Progress from "./Progress";

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDT_Sh2rufVus0ISono5Pb4ZGnU1LDF8CU",
    authDomain: "d4log-bfc60.firebaseapp.com",
    projectId: "d4log-bfc60",
    storageBucket: "d4log-bfc60.appspot.com",
    messagingSenderId: "37093938675",
    appId: "1:37093938675:web:a529225838441b0780ae86",
    measurementId: "G-DJ7FMXPHKQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

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
    return items.filter(i => i.id === selectedItemId).pop() ?? items.at(0);
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

function isScreenSmall(window: Window): boolean {
    return window.innerWidth <= 1200;
}

function App() {
    const store = useStore();
    const [db, setDb] = useState(createEmptyResultSet<Collection>());
    const [sideBar, setSideBar] = useState(SideBarType.ITEM);
    const [config, setConfig] = useState<Configuration>(store.loadConfig() ?? DEFAULT_CONFIG);
    const [smallScreen, setSmallScreen] = useState(isScreenSmall(window));
    const filteredDb = filterDb(db, store, config);
    const items = reduceItems(filteredDb);
    const [selectedItemId, setSelectedItemId] = useState(store.getLastSelectedItem()?.itemId ?? getDefaultItemIdForCollection(filteredDb));
    const selectedItem = selectItemOrDefault(items, selectedItemId);

    function onToggleConfig() {
        setSideBar(sideBar === SideBarType.CONFIG ? SideBarType.ITEM : SideBarType.CONFIG);
    }

    function onClickItem(collection: StrapiHit<Collection>, item: StrapiHit<Item>) {
        setSelectedItemId(item.id);
        setSideBar(SideBarType.ITEM);
        store.setLastSelectedItem(collection.id, item.id);
    }

    function onDoubleClickItem(_: StrapiHit<Collection>, item: StrapiHit<Item>) {
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
                if (Array.isArray(data.data)) {
                    setDb(data);
                }
            });
    }, [setDb]);

    useEffect(() => {
        function onResize() {
            setSmallScreen(isScreenSmall(window));
        }

        window.addEventListener('resize', onResize);

        return () => {
            window.removeEventListener('resize', onResize);
        }
    }, []);

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
                        view={smallScreen ? 'list' : config.view}
                        showCollected={config.showCollected}
                        inverseCards={config.inverseCards}
                    ></Ledger>
                    {config.showProgress &&
                        <Progress
                            totalCollected={items.reduce((a, c) => store.isCollected(c.id) ? a + 1 : a, 0)}
                            collectionSize={items.length}
                        ></Progress>
                    }
                </div>
            </section>
            <footer className={styles.AppFooter}>
                <div className={styles.AppFooterItem}>
                    <div className={styles.AppFooterSiteMeta}>
                        <div>Site Version: <code>{SITE_VERSION}</code></div>
                        <div>Last updated {LAST_UPDATED}</div>
                    </div>
                </div>
                <div className={styles.AppFooterItem}>
                    <div className={styles.AppFooterDiscord}>
                        <div className={styles.AppFooterDiscordIcon}>
                            <a href={DISCORD_INVITE_LINK}>
                                <svg stroke="currentColor" fill="#7289da" stroke-width="0" viewBox="0 0 640 512"
                                     xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M524.531,69.836a1.5,1.5,0,0,0-.764-.7A485.065,485.065,0,0,0,404.081,32.03a1.816,1.816,0,0,0-1.923.91,337.461,337.461,0,0,0-14.9,30.6,447.848,447.848,0,0,0-134.426,0,309.541,309.541,0,0,0-15.135-30.6,1.89,1.89,0,0,0-1.924-.91A483.689,483.689,0,0,0,116.085,69.137a1.712,1.712,0,0,0-.788.676C39.068,183.651,18.186,294.69,28.43,404.354a2.016,2.016,0,0,0,.765,1.375A487.666,487.666,0,0,0,176.02,479.918a1.9,1.9,0,0,0,2.063-.676A348.2,348.2,0,0,0,208.12,430.4a1.86,1.86,0,0,0-1.019-2.588,321.173,321.173,0,0,1-45.868-21.853,1.885,1.885,0,0,1-.185-3.126c3.082-2.309,6.166-4.711,9.109-7.137a1.819,1.819,0,0,1,1.9-.256c96.229,43.917,200.41,43.917,295.5,0a1.812,1.812,0,0,1,1.924.233c2.944,2.426,6.027,4.851,9.132,7.16a1.884,1.884,0,0,1-.162,3.126,301.407,301.407,0,0,1-45.89,21.83,1.875,1.875,0,0,0-1,2.611,391.055,391.055,0,0,0,30.014,48.815,1.864,1.864,0,0,0,2.063.7A486.048,486.048,0,0,0,610.7,405.729a1.882,1.882,0,0,0,.765-1.352C623.729,277.594,590.933,167.465,524.531,69.836ZM222.491,337.58c-28.972,0-52.844-26.587-52.844-59.239S193.056,219.1,222.491,219.1c29.665,0,53.306,26.82,52.843,59.239C275.334,310.993,251.924,337.58,222.491,337.58Zm195.38,0c-28.971,0-52.843-26.587-52.843-59.239S388.437,219.1,417.871,219.1c29.667,0,53.307,26.82,52.844,59.239C470.715,310.993,447.538,337.58,417.871,337.58Z"></path>
                                </svg>
                            </a>
                        </div>
                        <div className={styles.AppFooterDiscordInfo}>
                            <a className={styles.AppFooterDiscordLink} href={DISCORD_INVITE_LINK}>Join the Discord Server</a>
                            <div className={styles.AppFooterDiscordInfoSlugs}>Patch Notes | Job Board | Bragging</div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;
