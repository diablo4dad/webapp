import React, {ReactElement, useEffect, useRef, useState} from 'react';
import fetchDb, {
    Collection,
    createEmptyResultSet,
    getDefaultItemIdForCollection,
    Item,
    StrapiHit,
    StrapiResultSet,
} from "./db"
import logo from "./ gfx/d4ico.png"

import styles from './Application.module.css';
import Ledger from "./Ledger";
import useStore, {ItemFlag, Store} from "./Store";
import ItemSidebar from './ItemSidebar';
import ConfigSidebar, {Configuration, DEFAULT_CONFIG} from "./ConfigSidebar";
import {ContentType, DISCORD_INVITE_LINK, LAST_UPDATED, SITE_VERSION} from "./config";
import Progress from "./Progress";
import {Discord, Gear, Hamburger} from "./Icons";
import Button from "./Button";
import Authenticate, {AuthGiant, Orientation} from "./Authenticate";
import MobileMenu from "./MobileMenu";
import MobileCloseButton from "./MobileCloseButton";
import MobileHeader from "./MobileHeader";

import {initializeApp} from "firebase/app";
import {getAnalytics} from "firebase/analytics";
import {getAuth, GoogleAuthProvider, signInWithPopup, User} from "firebase/auth";
import Account, {Direction} from "./Account";

const firebaseConfig = {
    apiKey: "AIzaSyDT_Sh2rufVus0ISono5Pb4ZGnU1LDF8CU",
    authDomain: "d4log-bfc60.firebaseapp.com",
    projectId: "d4log-bfc60",
    storageBucket: "d4log-bfc60.appspot.com",
    messagingSenderId: "37093938675",
    appId: "1:37093938675:web:a529225838441b0780ae86",
    measurementId: "G-DJ7FMXPHKQ"
};

// Instantiate Firebase
const application = initializeApp(firebaseConfig);
const analytics = getAnalytics(application); // required
const auth = getAuth(application);
console.log("Firebase initialised.", {
    name: analytics.app.name,
    currentUser: auth.currentUser
});

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

    if (!config.showHiddenItems) {
        c = filterCollectionItems(c, filterHiddenItems(store));
    }

    return c;
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
    const [db, setDb] = useState(createEmptyResultSet<Collection>());
    const [sideBar, setSideBar] = useState(SideBarType.ITEM);
    const [content, setContent] = useState(ContentType.LEDGER);
    const [config, setConfig] = useState<Configuration>(store.loadConfig() ?? DEFAULT_CONFIG);
    const history = useRef([ContentType.LEDGER]);
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

    function pushHistory(content: ContentType) {
        if (content !== ContentType.MOBILE_MENU) {
            history.current.push(content);
        }
        return content;
    }

    function popHistory(): ContentType {
        return history.current.pop() ?? ContentType.LEDGER;
    }

    function signIn(giant: AuthGiant) {
        const provider = new GoogleAuthProvider();

        signInWithPopup(auth, provider)
            .then((result) => {
                // This gives you a Google Access Token. You can use it to access the Google API.
                const credential = GoogleAuthProvider.credentialFromResult(result);
                if (credential) {
                    const token = credential.accessToken;
                    // The signed-in user info.
                    const user = result.user;
                    // IdP data available using getAdditionalUserInfo(result)
                    // ...
                    console.log("Logged in.", { ...user });
                } else {
                    console.error("Signed in but Credential was null.");
                }

            }).catch((error) => {
            // Handle Errors here.
            const errorCode = error.code;
            const errorMessage = error.message;
            // The email of the user's account used.
            const email = error.customData.email;
            // The AuthCredential type that was used.
            const credential = GoogleAuthProvider.credentialFromError(error);
            // ...
        });
    }

    function signOut() {
        auth.signOut().then(() => {
            console.log("Signed out.");
        })
    }

    useEffect(() => {
        console.log("Bootstrapping...");

        // add user state listener
        auth.onAuthStateChanged((user) => {
            console.log("Auth state changed.", { ...user });
            setUser(user);
        });

        // load database
        fetchDb()
            .then(data => {
                if (Array.isArray(data.data)) {
                    setDb(data);
                }
            });
    }, [setDb]);

    return (
        <div className={styles.Page}>
            <div className={styles.PageHeader}>
                <header className={styles.Header}>
                    <div className={styles.HeaderLeft}>
                        <div className={styles.HeaderLeftContent}>
                            <img className={styles.HeaderIcon} src={logo} alt="Diablo 4"/>
                            <div className={styles.HeaderInfo}>
                                <div className={styles.HeaderInfoName}>diablo4.dad</div>
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
                            {config.enableProgressBar &&
                                <Progress
                                    totalCollected={items.filter(i => store.isCollected(i.id)).length}
                                    collectionSize={items.length}
                                />
                            }
                            {!config.enableProgressBar &&
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
                                {sideBar === SideBarType.ITEM && selectedItem &&
                                        <ItemSidebar
                                            item={selectedItem}
                                            hidden={store.isHidden(selectedItemId)}
                                            collected={store.isCollected(selectedItemId)}
                                            onClickCollected={() => store.toggle(selectedItemId, ItemFlag.COLLECTED)}
                                            onClickHidden={() => store.toggle(selectedItemId, ItemFlag.HIDDEN)}
                                        />
                                    }
                                    {sideBar === SideBarType.CONFIG &&
                                        <ConfigSidebar
                                            config={config}
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
                                view={config.view}
                                hideCollectedItems={config.hideCollectedItems}
                                hideCompleteCollections={config.hideCompleteCollections}
                                inverseCardLayout={config.inverseCardLayout}
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
                                    config={config}
                                    onChange={onConfigChange}
                                />
                                <MobileCloseButton onClick={() => setContent(popHistory())} />
                            </>
                        }
                    </main>
                </div>
            </div>
            {config.enableProgressBar && content === ContentType.LEDGER &&
                <div className={styles.ProgressMobile}>
                    <Progress
                        totalCollected={items.filter(i => store.isCollected(i.id)).length}
                        collectionSize={items.length}
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
