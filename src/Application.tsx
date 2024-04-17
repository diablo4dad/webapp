import React, {ReactElement, useCallback, useEffect, useRef, useState} from 'react';
import fetchDb, {
    countItemsInDb,
    createEmptyDb,
    DadCollection,
    DadCollectionItem,
    DadDb,
    DEFAULT_COLLECTION_ITEM,
    getDefaultItemIdForCollection,
    reduceItemIdsFromCollection,
    StrapiCollection,
    StrapiCollectionItem,
    StrapiResultSet,
    strapiToDad,
} from "./db"
import logo from "./image/d4ico.png"

import styles from './Application.module.css';
import Ledger from "./Ledger";
import useStore, {ItemFlag, Store} from "./store";
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
import {locale, MasterGroup} from "./common";
import LedgerSkeleton from "./LedgerSkeleton";
import Link from "./Link";
import {countTotalInCollectionUri} from "./server";
import {toggleItem} from "./store/mutations";


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
    BODY = "body",
    EMOTES = "emotes",
    TOWN_PORTALS = "town_portals",
    HEADSTONES = "headstones",
    EMBLEMS = "emblems",
    PLAYER_TITLES = "player_titles",
}

const itemGroups = new Map([
    [ItemGroup.MOUNTS, ["Mount"]],
    [ItemGroup.HORSE_ARMOR, ["Horse Armor"]],
    [ItemGroup.TROPHIES, ["Trophy", "Back Trophy"]],
    [ItemGroup.WEAPONS, ["Axe", "Dagger", "Focus", "Mace", "Scythe", "Shield", "Sword", "Totem", "Wand", "Two-Handed Axe", "Bow", "Crossbow", "Two-Handed Mace", "Polearm", "Two-Handed Scythe", "Staff", "Two-Handed Sword"]],
    [ItemGroup.ARMOR, ["Chest Armor", "Boots", "Gloves", "Helm", "Pants"]],
    [ItemGroup.BODY, ["Body Marking"]],
    [ItemGroup.EMOTES, ["Emote"]],
    [ItemGroup.TOWN_PORTALS, ["Town Portal"]],
    [ItemGroup.HEADSTONES, ["Headstone"]],
    [ItemGroup.EMBLEMS, ["Emblem"]],
    [ItemGroup.PLAYER_TITLES, ["Player Title (Prefix)", "Player Title (Suffix)"]],
]);

function reduceItems(db: DadDb): DadCollectionItem[] {
    return db.collections.flatMap(c => [...c.collectionItems, ...c.subcollections.flatMap(sc => sc.collectionItems)]);
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
        .concat(config.showBody ? itemGroups.get(ItemGroup.BODY) ?? [] : [])
        .concat(config.showEmotes ? itemGroups.get(ItemGroup.EMOTES) ?? [] : [])
        .concat(config.showTownPortals ? itemGroups.get(ItemGroup.TOWN_PORTALS) ?? [] : [])
        .concat(config.showHeadstones ? itemGroups.get(ItemGroup.HEADSTONES) ?? [] : [])
        .concat(config.showEmblems ? itemGroups.get(ItemGroup.EMBLEMS) ?? [] : [])
        .concat(config.showPlayerTitles ? itemGroups.get(ItemGroup.PLAYER_TITLES) ?? [] : []);
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

function enumKeys<O extends object, K extends keyof O = keyof O>(obj: O): K[] {
    return Object.keys(obj).filter(k => !Number.isNaN(k)) as K[]
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

type ViewModel = {
    db: DadDb,
    page: number,
    dbCount: number,
}

function Application(): ReactElement<HTMLDivElement> {
    const store = useStore();
    const [user, setUser] = useState<User | null>(null);
    const [db, setDb] = useState(createEmptyDb());
    const [dbCount, setDbCount] = useState(0);
    const [sideBar, setSideBar] = useState(SideBarType.ITEM);
    const [content, setContent] = useState(ContentType.LEDGER);
    const [masterGroup, setMasterGroup] = useState(MasterGroup.GENERAL);
    const history = useRef([ContentType.LEDGER]);
    const filteredDb = filterDb(db, store, store.loadConfig());
    const collectionItems = reduceItems(filteredDb);
    const lastSelected = store.getLastSelectedItem();
    const [selectedCollectionItemId, setSelectedCollectionItemId] = useState(lastSelected?.itemId ?? getDefaultItemIdForCollection(filteredDb));
    const selectedCollectionItem = selectItemOrDefault(collectionItems, selectedCollectionItemId);

    // maintains a group aggregated cache
    const groups = useRef(new Map<MasterGroup, ViewModel>());

    // references for "load on scroll" paging
    const contentRef = useRef<HTMLDivElement>(document.createElement('div'));
    const observers = useRef<IntersectionObserver[]>([]);

    // paging
    const pageRef = useRef(0);
    const loadingPromise = useRef<Promise<StrapiResultSet<StrapiCollection>> | null>(null);

    const onChangeCategory = (group: MasterGroup) => {
        observers.current.forEach(o => o.disconnect());
        observers.current = [];

        groups.current.set(masterGroup, {
            page: pageRef.current,
            db: db,
            dbCount: dbCount,
        });

        const vm = groups.current.get(group) ?? {
            db: createEmptyDb(),
            page: 0,
            dbCount: 0,
        };

        pageRef.current = vm.page;
        setMasterGroup(group);
        setDb(vm.db);
        setDbCount(vm.dbCount);
    }

    const fetchCollectionCount = useCallback(async (): Promise<number> => {
        // pre-condition; only count once
        if (dbCount !== 0) {
            return dbCount;
        }

        // fetch count from remote
        const resp = await fetch(countTotalInCollectionUri(masterGroup));
        const json = await resp.json() as StrapiResultSet<StrapiCollectionItem>;
        const remoteCount = json.meta.pagination.total;

        setDbCount(remoteCount);

        return remoteCount;
    }, [masterGroup]);

    const fetchDbCallback = useCallback(async (collection: MasterGroup, page: number)  => {
        // pre-condition
        if (loadingPromise.current) {
            console.log("[fetchDb] Request dropped; fetch in progress.");
            return;
        }

        // pre-condition
        if (page === -1) {
            console.log("[fetchDb] Request dropped; pagination exhausted.");
            return;
        }

        console.log("[fetchDb] Loading...", { collection, page });
        loadingPromise.current = fetchDb(collection, page);

        try {
            // merge page into base
            const resp = await loadingPromise.current;

            // user changed category before finished loading... drop
            // if (collection !== masterGroup) {
            //     console.log("Category changed, payload dropped.", {
            //         'expected': collection,
            //         'found': masterGroup,
            //     });
            //     return;
            // }

            const nextPage = strapiToDad(resp);
            setDb(existing => ({
                collections: [...existing.collections, ...nextPage.collections]
            }));

            // bump page count
            if (resp.meta.pagination.page === resp.meta.pagination.pageCount) {
                pageRef.current = -1;
            } else {
                pageRef.current = resp.meta.pagination.page + 1;
            }
        } catch (e) {
            console.log("[fetchDb] Error occurred...", e);
        } finally {
            loadingPromise.current = null;
        }
    }, []);

    const attachObserver = useCallback(async (el: HTMLDetailsElement | null, index: number) => {
        // pre-condition
        if (el === null) {
            return;
        }

        // pre-condition
        if (index !== filteredDb.collections.length - 1) {
            return;
        }

        // pre-condition
        if (index in observers.current) {
            return;
        }

        console.log("[Observe] Attaching fetchDb callback to ledger.", {
            ledgerIndex: index,
            dbLength: filteredDb.collections.length,
        });

        const onInteraction = (obs: IntersectionObserverEntry[]) => {
            // pre-condition
            if (obs.length === 0) {
                console.log("[Observe] Empty.", { index });
                return;
            }

            // sanity check
            if (obs.length > 1) {
                console.log("[Observe] Multiple entries observed.", { index });
            }

            const first = obs[0];
            console.log("[Observe] Intersecting.", { index, isIntersecting: first.isIntersecting });

            // on enter screen, fetch the next page
            if (first.isIntersecting) {
                fetchDbCallback(masterGroup, pageRef.current).then(() => {
                    console.log("[Observe] Disconnecting.", { index });
                    observers.current[index]?.disconnect();
                });
            }
        }

        // attach observer
        observers.current[index] = new IntersectionObserver(onInteraction);
        observers.current[index].observe(el);
    }, [filteredDb]);

    function onToggleConfig() {
        setSideBar(sideBar === SideBarType.CONFIG ? SideBarType.ITEM : SideBarType.CONFIG);
    }

    function onClickItem(collection: DadCollection, collectionItem: DadCollectionItem) {
        setSelectedCollectionItemId(collectionItem.strapiId);
        setSideBar(SideBarType.ITEM);
        store.setLastSelectedItem(collection.strapiId, collectionItem.strapiId);
    }

    function onDoubleClickItem(_: DadCollection, collectionItem: DadCollectionItem) {
        store.toggle(collectionItem.strapiId, masterGroup);
    }

    function onSelectAll(collection: DadCollection, selectAll: boolean) {
        return reduceItemIdsFromCollection(collection).map(toggleItem(store, masterGroup, selectAll));
    }

    function onConfigChange(config: Configuration) {
        store.saveConfig(config);
    }

    function onNavigate(content: ContentType, group?: MasterGroup) {
        setContent(pushHistory(content));
        if (group) {
            onChangeCategory(group);
        }
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
                    console.log("[Auth] Logged in.", { ...user });
                } else {
                    console.error("[Auth] Signed in but Credential was null.");
                }
            }).catch((error) => {
                console.log("[Auth] Error signing in.", error);
            });
    }

    function signOut() {
        auth.signOut().then(() => {
            console.log("[Auth] Signed out.");
        })
    }

    // auth effect
    useEffect(() => {
        console.log("[Auth] Authenticating...");

        // load html5 storage
        store.init();

        // add user state listener
        const unsubscribe = auth.onAuthStateChanged((user) => {
            console.log("[Auth] State changed.", { ...user });
            setUser(user);

            // init firebase storage
            store.init(user?.uid);
        });

        return () => {
            console.log("[Auth] Unsubscribing...");
            unsubscribe();
        }
    }, []);

    // initial page load
    useEffect(() => {
        // pre-condition; only auto-fetch the initial page
        if (pageRef.current !== 0) {
            return;
        }

        console.log("[Bootstrap] Initialing...", masterGroup);

        // not used in static mode... needs rework to fix live mode
        // fetchCollectionCount().then((count) => {
        //     console.log("[Bootstrap] Fetched count.", count);
        // });

        fetchDbCallback(masterGroup, pageRef.current).then(() => {
            console.log("[Bootstrap] Fetched DB.");
        });
    }, [masterGroup]);

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
                            <nav className={styles.HeaderNav}>
                                {enumKeys(MasterGroup).map((key) => {
                                    const value = MasterGroup[key];
                                    return <div key={key} className={styles.HeaderNavItem + ' ' + (masterGroup === value ? styles.HeaderNavItemSelected : '')}>
                                        <Link disabled={masterGroup === value}
                                              onClick={() => onChangeCategory(value)}>{locale[value]}
                                        </Link>
                                    </div>
                                })}
                            </nav>
                            <div className={styles.HeaderAccountWidgets}>
                            {store.loadConfig().enableProgressBar &&
                                <Progress
                                    totalCollected={collectionItems.filter(i => store.isCollected(i.strapiId)).length}
                                    collectionSize={countItemsInDb(filteredDb)}
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
                    </div>
                </header>
            </div>
            <div className={styles.PageContent} ref={contentRef}>
                <div className={styles.Shell}>
                    <aside className={styles.Sidebar}>
                        <div className={styles.SidebarLayout}>
                            <div className={styles.SidebarLayoutTop}></div>
                            <div className={styles.SidebarLayoutBottom}>
                                <section className={styles.SidebarContent}>
                                    {sideBar === SideBarType.ITEM && selectedCollectionItem &&
                                        <>
                                            <ItemSidebar
                                                collectionItem={selectedCollectionItem}
                                                hidden={store.isHidden(selectedCollectionItemId)}
                                                collected={store.isCollected(selectedCollectionItemId)}
                                                onClickCollected={(collected) => store.toggle(selectedCollectionItemId, masterGroup, ItemFlag.COLLECTED, collected)}
                                                onClickHidden={(hidden) => store.toggle(selectedCollectionItemId, masterGroup, ItemFlag.HIDDEN, hidden)}
                                            />
                                            <footer className={styles.SidebarFooter}>
                                                <DiscordInvite/>
                                                <VersionInfo/>
                                            </footer>
                                        </>
                                    }
                                    {sideBar === SideBarType.CONFIG &&
                                        <ConfigSidebar
                                            config={store.loadConfig()}
                                            onChange={onConfigChange}
                                        />
                                    }
                                </section>
                            </div>
                        </div>
                    </aside>
                    <main className={styles.Content}>
                        {content === ContentType.LEDGER &&
                            <>
                                {filteredDb.collections.map((collection, index) => (
                                    <Ledger
                                        key={collection.strapiId}
                                        ref={ref => attachObserver(ref, index)}
                                        collection={collection}
                                        store={store}
                                        onClickItem={onClickItem}
                                        onDoubleClickItem={onDoubleClickItem}
                                        onSelectAllToggle={onSelectAll}
                                        view={store.loadConfig().view}
                                        hideCollectedItems={store.loadConfig().hideCollectedItems}
                                        hideCompleteCollections={store.loadConfig().hideCompleteCollections}
                                        inverseCardLayout={store.loadConfig().inverseCardLayout}
                                    />
                                ))}
                                {(filteredDb.collections.length === 0 || loadingPromise.current !== null) &&
                                    <>
                                        <LedgerSkeleton view={store.loadConfig().view} numItems={6} />
                                        <LedgerSkeleton view={store.loadConfig().view} numItems={6} />
                                        <LedgerSkeleton view={store.loadConfig().view} numItems={6} />
                                    </>
                                }
                            </>
                        }
                        {content === ContentType.MOBILE_MENU &&
                            <>
                                <MobileHeader>Menu</MobileHeader>
                                <MobileMenu currentUser={user} onNavigate={onNavigate} onAuth={signIn} onLogout={signOut} />
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
                        collectionSize={countItemsInDb(filteredDb)}
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
