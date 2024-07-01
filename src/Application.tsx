import React, {
  ReactElement,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  DadCollection,
  DadCollectionItem,
  DadDb,
  StrapiCollection,
  StrapiResultSet,
} from "./data";
import logo from "./image/d4ico.png";

import styles from "./Application.module.css";
import Ledger from "./Ledger";
import useStore from "./store";
import ItemSidebar from "./ItemSidebar";
import ConfigSidebar from "./ConfigSidebar";
import { DISCORD_INVITE_LINK, LAST_UPDATED, SITE_VERSION } from "./config";
import Progress from "./components/Progress";
import { Discord, Gear, Hamburger } from "./Icons";
import Button, { BtnColours } from "./Button";
import Authenticate, { AuthGiant, Orientation } from "./Authenticate";
import MobileMenu from "./MobileMenu";
import MobileCloseButton from "./MobileCloseButton";
import MobileHeader from "./MobileHeader";

import { GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";

import Account, { Direction } from "./components/Account";
import { auth } from "./config/firebase";
import { ContentType, MasterGroup, SideBarType } from "./common";
import LedgerSkeleton from "./LedgerSkeleton";
import { fetchDb } from "./server";
import NavMenu from "./NavMenu";
import { selectItemOrDefault } from "./data/reducers";
import { filterDb } from "./data/filters";
import { flattenDadDb, strapiToDad } from "./data/transforms";
import { countAllItemsDabDb } from "./data/aggregate";
import { getDefaultItemId } from "./data/getters";
import { createEmptyDb } from "./data/factory";
import { useCollection } from "./collection/context";
import { useSettings } from "./settings/context";
import { getLedgerViewSetting } from "./settings/accessor";
import { saveCollection, saveSettings } from "./store/local";
import { countItemInDbOwned } from "./collection/aggregate";

function VersionInfo(): ReactElement<HTMLDivElement> {
  return (
    <div className={styles.SiteVersion}>
      <div>Last updated {LAST_UPDATED}</div>
      <div>
        Site Version <code>{SITE_VERSION}</code>
      </div>
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
        <a className={styles.DiscordInfoLink} href={DISCORD_INVITE_LINK}>
          Join the Discord Server
        </a>
        <div className={styles.DiscordInfoSlugs}>
          Site News | Help Needed | Bragging
        </div>
      </div>
    </div>
  );
}

type ViewModel = {
  db: DadDb;
  page: number;
  dbCount: number;
};

function Application(): ReactElement<HTMLDivElement> {
  const log = useCollection();
  const settings = useSettings();
  const store = useStore();

  // persist settings
  useEffect(() => {
    saveCollection(log);
    saveSettings(settings);
  }, [settings, log]);

  const [user, setUser] = useState<User | null>(null);
  const [db, setDb] = useState(createEmptyDb());
  const [dbCount, setDbCount] = useState(0);
  const [sideBar, setSideBar] = useState(SideBarType.ITEM);
  const [content, setContent] = useState(ContentType.LEDGER);
  const [masterGroup, setMasterGroup] = useState(MasterGroup.GENERAL);
  const history = useRef([ContentType.LEDGER]);
  const filteredDb = filterDb(db, settings, store.isHidden, store.isCollected);
  const collectionItems = flattenDadDb(filteredDb);
  const lastSelected = store.getLastSelectedItem();
  const [selectedCollectionItemId, setSelectedCollectionItemId] = useState(
    lastSelected?.itemId ?? getDefaultItemId(filteredDb),
  );
  const selectedCollectionItem = selectItemOrDefault(
    collectionItems,
    selectedCollectionItemId,
  );

  // maintains a group aggregated cache
  const groups = useRef(new Map<MasterGroup, ViewModel>());

  // references for "load on scroll" paging
  const contentRef = useRef<HTMLDivElement>(document.createElement("div"));
  const observers = useRef<IntersectionObserver[]>([]);

  // paging
  const pageRef = useRef(0);
  const loadingPromise = useRef<Promise<
    StrapiResultSet<StrapiCollection>
  > | null>(null);

  const onChangeCategory = (group: MasterGroup) => {
    observers.current.forEach((o) => o.disconnect());
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
  };

  const fetchDbCallback = useCallback(
    async (collection: MasterGroup, page: number) => {
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
        setDb((existing) => ({
          collections: [...existing.collections, ...nextPage.collections],
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
    },
    [],
  );

  function onToggleConfig() {
    setSideBar(
      sideBar === SideBarType.CONFIG ? SideBarType.ITEM : SideBarType.CONFIG,
    );
  }

  function onClickItem(
    collection: DadCollection,
    collectionItem: DadCollectionItem,
  ) {
    setSelectedCollectionItemId(collectionItem.strapiId);
    setSideBar(SideBarType.ITEM);
    store.setLastSelectedItem(collection.strapiId, collectionItem.strapiId);
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
    if (
      history.current.length &&
      history.current[history.current.length - 1] === content
    ) {
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
      })
      .catch((error) => {
        console.log("[Auth] Error signing in.", error);
      });
  }

  function signOut() {
    auth.signOut().then(() => {
      console.log("[Auth] Signed out.");
    });
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
    };
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
              <img className={styles.HeaderIcon} src={logo} alt="Diablo 4" />
              <div className={styles.HeaderInfo}>
                <div className={styles.HeaderInfoName}>Diablo 4 Dad</div>
                <div className={styles.HeaderInfoTagLine}>
                  Bringing closure to the completionist in you
                </div>
              </div>
              <div className={styles.HeaderButtons}>
                <Button
                  onClick={onToggleConfig}
                  pressed={sideBar === SideBarType.CONFIG}
                  showOnly={"desktop"}
                  colour={BtnColours.Dark}
                >
                  <Gear />
                </Button>
                <Button
                  onClick={() =>
                    setContent(
                      content === ContentType.MOBILE_MENU
                        ? popHistory()
                        : pushHistory(ContentType.MOBILE_MENU),
                    )
                  }
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
                <NavMenu
                  activeGroup={masterGroup}
                  onChange={onChangeCategory}
                />
              </nav>
              <div className={styles.HeaderAccountWidgets}>
                <Progress
                  totalCollected={countItemInDbOwned(log, filteredDb)}
                  collectionSize={countAllItemsDabDb(filteredDb)}
                />
                {user === null && (
                  <Authenticate orientation={Orientation.ROW} onAuth={signIn} />
                )}
                {user !== null && (
                  <Account
                    currentUser={user}
                    onLogout={signOut}
                    direction={Direction.ROW}
                  />
                )}
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
                  {sideBar === SideBarType.ITEM && selectedCollectionItem && (
                    <>
                      <ItemSidebar collectionItem={selectedCollectionItem} />
                      <footer className={styles.SidebarFooter}>
                        <DiscordInvite />
                        <VersionInfo />
                      </footer>
                    </>
                  )}
                  {sideBar === SideBarType.CONFIG && <ConfigSidebar />}
                </section>
              </div>
            </div>
          </aside>
          <main className={styles.Content}>
            {content === ContentType.LEDGER && (
              <>
                <Ledger
                  collections={filteredDb.collections}
                  store={store}
                  onClickItem={onClickItem}
                />
                {(filteredDb.collections.length === 0 ||
                  loadingPromise.current !== null) && (
                  <>
                    <LedgerSkeleton
                      view={getLedgerViewSetting(settings)}
                      numItems={6}
                    />
                    <LedgerSkeleton
                      view={getLedgerViewSetting(settings)}
                      numItems={6}
                    />
                    <LedgerSkeleton
                      view={getLedgerViewSetting(settings)}
                      numItems={6}
                    />
                  </>
                )}
              </>
            )}
            {content === ContentType.MOBILE_MENU && (
              <>
                <MobileHeader>Menu</MobileHeader>
                <MobileMenu
                  currentUser={user}
                  onNavigate={onNavigate}
                  onAuth={signIn}
                  onLogout={signOut}
                />
                <MobileCloseButton onClick={() => setContent(popHistory())} />
              </>
            )}
            {content === ContentType.CONFIG && (
              <>
                <MobileHeader>Settings</MobileHeader>
                <ConfigSidebar />
                <MobileCloseButton onClick={() => setContent(popHistory())} />
              </>
            )}
          </main>
        </div>
      </div>
      {content === ContentType.LEDGER && (
        <div className={styles.ProgressMobile}>
          <Progress
            totalCollected={countItemInDbOwned(log, filteredDb)}
            collectionSize={countAllItemsDabDb(filteredDb)}
          />
        </div>
      )}
      <footer className={styles.Footer}>
        <DiscordInvite />
        <VersionInfo />
      </footer>
    </div>
  );
}

export default Application;
