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
import {Discord, Gear} from "./Icons";

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
                    <div className={styles.AppSideBarContent}>
                        <div className={styles.AppSideBarContentTop}>
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
                                        <Gear />
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
                        <div className={styles.AppSideBarContentBottom}>
                            <DiscordInvite></DiscordInvite>
                            <VersionInfo></VersionInfo>
                        </div>
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
                    <DiscordInvite></DiscordInvite>
                </div>
                <div className={styles.AppFooterItem}>
                    <VersionInfo></VersionInfo>
                </div>
            </footer>
        </div>
    );
}

function VersionInfo() {
    return (
        <div className={styles.AppFooterSiteMeta}>
            <div>Last updated {LAST_UPDATED}</div>
            <div>Site Version <code>{SITE_VERSION}</code></div>
        </div>
    );
}

function DiscordInvite() {
    return (
        <div className={styles.AppFooterDiscord}>
            <div className={styles.AppFooterDiscordIcon}>
                <a href={DISCORD_INVITE_LINK}>
                    <Discord></Discord>
                </a>
            </div>
            <div className={styles.AppFooterDiscordInfo}>
                <a className={styles.AppFooterDiscordLink} href={DISCORD_INVITE_LINK}>Join the Discord Server</a>
                <div className={styles.AppFooterDiscordInfoSlugs}>Patch Notes | Job Board | Bragging</div>
            </div>
        </div>
    );
}

export default App;
