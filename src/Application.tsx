import React, {ReactElement, useCallback, useEffect, useRef, useState} from 'react';
import fetchDb, {
    countItemsInDb,
    createEmptyDb,
    DadCollection,
    DadCollectionItem,
    DadDb,
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
import useStore, {ItemFlag} from "./store";
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
import {MasterGroup, SideBarType} from "./common";
import LedgerSkeleton from "./LedgerSkeleton";
import {countTotalInCollectionUri} from "./server";
import {toggleItem} from "./store/mutations";
import NavMenu from "./NavMenu";
import {selectItemOrDefault} from "./db/reducers";
import {filterDb} from "./db/filters";
import {flattenDadDb} from "./db/transforms";


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
    const collectionItems = flattenDadDb(filteredDb);
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
                                <NavMenu activeGroup={masterGroup} onChange={onChangeCategory} />
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
