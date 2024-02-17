import React, {ReactElement, useEffect, useRef, useState} from 'react';
import fetchDb, {
    createEmptyDb,
    DadCollection,
    DadCollectionItem,
    DadDb,
    DEFAULT_COLLECTION_ITEM,
    getDefaultItemIdForCollection,
    strapiToDad,
} from "./db"
import logo from "./ gfx/d4ico.png"

import styles from './Application.module.css';
import Ledger from "./Ledger";
import useStore, {ItemFlag, Store} from "./Store";
import ItemSidebar from './ItemSidebar';
import ConfigSidebar, {Configuration} from "./ConfigSidebar";
import {ContentType, DISCORD_INVITE_LINK, LAST_UPDATED, SITE_VERSION} from "./config";
import Progress from "./Progress";
import {Discord, Gear, Hamburger} from "./Icons";
import Button from "./Button";
import Authenticate, {AuthGiant, Orientation} from "./Authenticate";
import MobileMenu from "./MobileMenu";
import MobileCloseButton from "./MobileCloseButton";
import MobileHeader from "./MobileHeader";

import {GoogleAuthProvider, signInWithPopup, User} from "firebase/auth";

import Account, {Direction} from "./Account";
import {auth} from "./firebase";


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
    BODY = "body"
}

const itemGroups = new Map([
    [ItemGroup.MOUNTS, ["Mount"]],
    [ItemGroup.HORSE_ARMOR, ["Horse Armor"]],
    [ItemGroup.TROPHIES, ["Trophy", "Back Trophy"]],
    [ItemGroup.WEAPONS, ["Axe", "Dagger", "Focus", "Mace", "Scythe", "Shield", "Sword", "Totem", "Wand", "Two-Handed Axe", "Bow", "Crossbow", "Two-Handed Mace", "Polearm", "Two-Handed Scythe", "Staff", "Two-Handed Sword"]],
    [ItemGroup.ARMOR, ["Chest Armor", "Boots", "Gloves", "Helm", "Pants"]],
    [ItemGroup.BODY, ["Body Marking"]],
]);

function reduceItems(db: DadDb): DadCollectionItem[] {
    return db.collections.flatMap(c => c.collectionItems);
}

function filterCollectionItems(db: DadDb, filter: (dci: DadCollectionItem) => boolean): DadDb {
    return {
        collections: db.collections.map(dc => {
            return {
                ...dc,
                collectionItems: dc.collectionItems.filter(filter),
            };
        }),
    };
}

function filterItemsByType(itemTypes: string[]): (dci: DadCollectionItem) => boolean {
    return function (dci: DadCollectionItem) {
        return itemTypes.flatMap(it => dci.items.filter(di => di.itemType === it)).length !== 0;
    }
}

function filterPremiumItems(): (dci: DadCollectionItem) => boolean {
    return (dci: DadCollectionItem) => dci.premium !== true;
}

function filterPromotionalItems(): (dci: DadCollectionItem) => boolean {
    return (dci: DadCollectionItem) => dci.promotional !== true;
}

function filterOutOfRotationItems(): (dci: DadCollectionItem) => boolean {
    return (dci: DadCollectionItem) => dci.outOfRotation !== true;
}

function filterHiddenItems(store: Store): (dci: DadCollectionItem) => boolean {
    return (dci: DadCollectionItem) => !store.isHidden(dci.strapiId);
}

function aggregateItemTypes(config: Configuration): string[] {
    return Array<string>()
        .concat(config.showMounts ? itemGroups.get(ItemGroup.MOUNTS) ?? [] : [])
        .concat(config.showHorseArmor ? itemGroups.get(ItemGroup.HORSE_ARMOR) ?? [] : [])
        .concat(config.showTrophies ? itemGroups.get(ItemGroup.TROPHIES) ?? [] : [])
        .concat(config.showArmor ? itemGroups.get(ItemGroup.ARMOR) ?? [] : [])
        .concat(config.showWeapons ? itemGroups.get(ItemGroup.WEAPONS) ?? [] : [])
        .concat(config.showBody ? itemGroups.get(ItemGroup.BODY) ?? [] : []);
}

function selectItemOrDefault(dci: DadCollectionItem[], selectedItemId: number): DadCollectionItem {
    return dci.filter(ci => ci.strapiId === selectedItemId).pop() ?? dci.at(0) ?? DEFAULT_COLLECTION_ITEM;
}

function filterDb(dadDb: DadDb, store: Store, config: Configuration): DadDb {
    let db = filterCollectionItems(dadDb, filterItemsByType(aggregateItemTypes(config)));

    if (!config.showPremium) {
        db = filterCollectionItems(db, filterPremiumItems());
    }

    if (!config.showOutOfRotation) {
        db = filterCollectionItems(db, filterOutOfRotationItems());
    }

    if (!config.showPromotional) {
        db = filterCollectionItems(db, filterPromotionalItems());
    }

    if (!config.showHiddenItems) {
        db = filterCollectionItems(db, filterHiddenItems(store));
    }

    return db;
}

function VersionInfo(): ReactElement<HTMLDivElement> {
    return (
        <div className={styles.SiteVersion}>
            <div>Last updated {LAST_UPDATED}</div>
            <div>Site Version <code>{SITE_VERSION}</code></div>
        </div>
    );
}

function DiscordInvite(): ReactElement<HTMLDivElement> {
    return (
        <div className={styles.Discord}>
            <div className={styles.DiscordIcon}>
                <a href={DISCORD_INVITE_LINK}>
                    <Discord></Discord>
                </a>
            </div>
            <div className={styles.DiscordInfo}>
                <a className={styles.DiscordInfoLink} href={DISCORD_INVITE_LINK}>Join the Discord Server</a>
                <div className={styles.DiscordInfoSlugs}>Site News | Help Needed | Bragging</div>
            </div>
        </div>
    );
}

function Application(): ReactElement<HTMLDivElement> {
    const store = useStore();
    const [user, setUser] = useState<User | null>(null);
    const [db, setDb] = useState(createEmptyDb());
    const [sideBar, setSideBar] = useState(SideBarType.ITEM);
    const [content, setContent] = useState(ContentType.LEDGER);
    const history = useRef([ContentType.LEDGER]);
    const filteredDb = filterDb(db, store, store.loadConfig());
    const collectionItems = reduceItems(filteredDb);
    const lastSelected = store.getLastSelectedItem();
    const [selectedCollectionItemId, setSelectedCollectionItemId] = useState(lastSelected?.itemId ?? getDefaultItemIdForCollection(filteredDb));
    const selectedCollectionItem = selectItemOrDefault(collectionItems, selectedCollectionItemId);

    function onToggleConfig() {
        setSideBar(sideBar === SideBarType.CONFIG ? SideBarType.ITEM : SideBarType.CONFIG);
    }

    function onClickItem(collection: DadCollection, collectionItem: DadCollectionItem) {
        setSelectedCollectionItemId(collectionItem.strapiId);
        setSideBar(SideBarType.ITEM);
        store.setLastSelectedItem(collection.strapiId, collectionItem.strapiId);
    }

    function onDoubleClickItem(_: DadCollection, collectionItem: DadCollectionItem) {
        store.toggle(collectionItem.strapiId);
    }

    function onSelectAll(collection: DadCollection, selectAll: boolean) {
        collection.collectionItems.map(i => i.strapiId).forEach(i => store.toggle(i, ItemFlag.COLLECTED, selectAll));
    }

    function onConfigChange(config: Configuration) {
        store.saveConfig(config);
    }

    function pushHistory(content: ContentType) {
        if ([ContentType.CONFIG, ContentType.MOBILE_MENU].includes(content)) {
            return content;
        }
        if (history.current.length && history.current[history.current.length - 1] === content) {
            return content;
        }

        history.current.push(content);

        return content;
    }

    function popHistory(): ContentType {
        return history.current.pop() ?? ContentType.LEDGER;
    }

    function signIn(giant: AuthGiant) {
        const provider = new GoogleAuthProvider();

        signInWithPopup(auth, provider)
            .then((result) => {
                const credential = GoogleAuthProvider.credentialFromResult(result);
                if (credential) {
                    const user = result.user;
                    console.log("Logged in.", { ...user });
                } else {
                    console.error("Signed in but Credential was null.");
                }
            }).catch((error) => {
                console.log("Error signing in.", error);
            });
    }

    function signOut() {
        auth.signOut().then(() => {
            console.log("Signed out.");
        })
    }

    useEffect(() => {
        console.log("Bootstrapping...");

        // load html5 storage
        store.init();

        // add user state listener
        const unsubscribe = auth.onAuthStateChanged((user) => {
            console.log("Auth state changed.", { ...user });
            setUser(user);

            // init firebase storage
            store.init(user?.uid);
        });

        // load database
        fetchDb()
            .then(data => {
                if (Array.isArray(data.data)) {
                    setDb(strapiToDad(data));
                }
            });

        return () => {
            console.log("Tearing Down application...");
            unsubscribe();
        };
    }, [setDb]);

    return (
        <div className={styles.Page}>
            <div className={styles.PageHeader}>
                <header className={styles.Header}>
                    <div className={styles.HeaderLeft}>
                        <div className={styles.HeaderLeftContent}>
                            <img className={styles.HeaderIcon} src={logo} alt="Diablo 4"/>
                            <div className={styles.HeaderInfo}>
                                <div className={styles.HeaderInfoName}>Diablo 4 Dad</div>
                                <div className={styles.HeaderInfoTagLine}>Bringing closure to the completionist
                                    in you
                                </div>
                            </div>
                            <div className={styles.HeaderButtons}>
                                <Button
                                    onClick={onToggleConfig}
                                    pressed={sideBar === SideBarType.CONFIG}
                                    showOnly={"desktop"}
                                >
                                    <Gear />
                                </Button>
                                <Button
                                    onClick={() => setContent(content === ContentType.MOBILE_MENU ? popHistory() : pushHistory(ContentType.MOBILE_MENU))}
                                    pressed={content === ContentType.MOBILE_MENU}
                                    showOnly={"mobile"}
                                >
                                    <Hamburger />
                                </Button>
                            </div>
                        </div>
                    </div>
                    <div className={styles.HeaderRight}>
                        <div className={styles.HeaderRightContent}>
                            {store.loadConfig().enableProgressBar &&
                                <Progress
                                    totalCollected={collectionItems.filter(collectionItem => store.isCollected(collectionItem.strapiId)).length}
                                    collectionSize={collectionItems.length}
                                />
                            }
                            {!store.loadConfig().enableProgressBar &&
                                <div>{/*Progress Bar Disabled*/}</div>
                            }
                            {user === null &&
                                <Authenticate orientation={Orientation.ROW} onAuth={signIn}/>
                            }
                            {user !== null &&
                                <Account currentUser={user} onLogout={signOut} direction={Direction.ROW}/>
                            }
                        </div>
                    </div>
                </header>
            </div>
            <div className={styles.PageContent}>
                <div className={styles.Shell}>
                    <aside className={styles.Sidebar}>
                        <div className={styles.SidebarLayout}>
                            <div className={styles.SidebarLayoutTop}></div>
                            <div className={styles.SidebarLayoutBottom}>
                                <section className={styles.SidebarContent}>
                                    {sideBar === SideBarType.ITEM && selectedCollectionItem &&
                                        <ItemSidebar
                                            collectionItem={selectedCollectionItem}
                                            hidden={store.isHidden(selectedCollectionItemId)}
                                            collected={store.isCollected(selectedCollectionItemId)}
                                            onClickCollected={(collected) => store.toggle(selectedCollectionItemId, ItemFlag.COLLECTED, collected)}
                                            onClickHidden={(hidden) => store.toggle(selectedCollectionItemId, ItemFlag.HIDDEN, hidden)}
                                        />
                                    }
                                    {sideBar === SideBarType.CONFIG &&
                                        <ConfigSidebar
                                            config={store.loadConfig()}
                                            onChange={onConfigChange}
                                        />
                                    }
                                </section>
                                <footer className={styles.SidebarFooter}>
                                    <DiscordInvite/>
                                    <VersionInfo/>
                                </footer>
                            </div>
                        </div>
                    </aside>
                    <main className={styles.Content}>
                        {content === ContentType.LEDGER &&
                            <Ledger
                                db={filteredDb}
                                store={store}
                                onClickItem={onClickItem}
                                onDoubleClickItem={onDoubleClickItem}
                                onSelectAllToggle={onSelectAll}
                                view={store.loadConfig().view}
                                hideCollectedItems={store.loadConfig().hideCollectedItems}
                                hideCompleteCollections={store.loadConfig().hideCompleteCollections}
                                inverseCardLayout={store.loadConfig().inverseCardLayout}
                            />
                        }
                        {content === ContentType.MOBILE_MENU &&
                            <>
                                <MobileHeader>Menu</MobileHeader>
                                <MobileMenu currentUser={user} onNavigate={(place) => setContent(pushHistory(place))} onAuth={signIn} onLogout={signOut} />
                                <MobileCloseButton onClick={() => setContent(popHistory())} />
                            </>
                        }
                        {content === ContentType.CONFIG &&
                            <>
                                <MobileHeader>Settings</MobileHeader>
                                <ConfigSidebar
                                    config={store.loadConfig()}
                                    onChange={onConfigChange}
                                />
                                <MobileCloseButton onClick={() => setContent(popHistory())} />
                            </>
                        }
                    </main>
                </div>
            </div>
            {store.loadConfig().enableProgressBar && content === ContentType.LEDGER &&
                <div className={styles.ProgressMobile}>
                    <Progress
                        totalCollected={collectionItems.filter(i => store.isCollected(i.strapiId)).length}
                        collectionSize={collectionItems.length}
                    />
                </div>
            }
            <footer className={styles.Footer}>
                <DiscordInvite/>
                <VersionInfo/>
            </footer>
        </div>
    );
}

export default Application;
