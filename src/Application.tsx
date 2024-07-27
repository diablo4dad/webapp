import React, {
  ReactElement,
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
import { DadCollection, DadCollectionItem } from "./data";
import logo from "./image/d4ico.png";

import styles from "./Application.module.css";
import Ledger from "./Ledger";
import ConfigSidebar from "./ConfigSidebar";
import Progress from "./components/Progress";
import { Gear, Hamburger } from "./Icons";
import Button, { BtnColours } from "./Button";
import Authenticate, { AuthGiant, Orientation } from "./Authenticate";
import MobileMenu from "./MobileMenu";
import MobileCloseButton from "./MobileCloseButton";
import MobileHeader from "./MobileHeader";

import { GoogleAuthProvider, signInWithPopup, User } from "firebase/auth";

import Account, { Direction } from "./components/Account";
import { auth } from "./config/firebase";
import { ContentType, MasterGroup, SideBarType } from "./common";
import NavMenu from "./NavMenu";
import { selectItemOrDefault } from "./data/reducers";
import { flattenDadDb } from "./data/transforms";
import { countAllItemsDabDb } from "./data/aggregate";
import { getDefaultItemId } from "./data/getters";
import {
  CollectionActionType,
  useCollection,
  useCollectionDispatch,
} from "./collection/context";
import { useSettings } from "./settings/context";
import {
  getViewModel,
  saveCollection,
  saveSettings,
  saveVersion,
  saveViewModel,
} from "./store/local";
import { countItemInDbOwned } from "./collection/aggregate";
import placeholder from "./image/placeholder.webp";
import { toggleValueInArray } from "./common/arrays";
import { fetchFromFirestore, saveToFirestore } from "./store/firestore";
import Shell from "./Shell";
import { VersionInfo } from "./components/VersionPanel";
import { DiscordInvite } from "./components/DiscordPanel";
import { useData } from "./data/context";
import ItemSidebarSkeleton from "./ItemSidebarSkeleton";
import LedgerSkeleton from "./LedgerSkeleton";
import { Await, useLoaderData } from "react-router-dom";
import { LoaderPayload } from "./routes/CollectionLog";
import ItemSidebar from "./ItemSidebar";
import { VERSION } from "./config";
import { runPreV170Migrations } from "./migrations";
import { initStore } from "./store";

export type ViewModel = {
  openCollections: number[];
};

// Controls heading contents
// Controls sidebar contents
// Provides outlet
// Needs D4Data
// Needs Settings
// Needs Collections Log
function Application(): ReactElement<HTMLDivElement> {
  const { db: dbPromise, group } = useLoaderData() as LoaderPayload;
  const { filteredDb, countedDb } = useData();
  const log = useCollection();
  const dispatch = useCollectionDispatch();
  const settings = useSettings();

  const [vm, setVm] = useState<ViewModel>(getViewModel());

  const itemsCollected = countItemInDbOwned(log, countedDb);
  const itemsTotal = countAllItemsDabDb(countedDb);

  // persist settings
  saveViewModel(vm);
  saveCollection(log);
  saveSettings(settings);

  // preload to prevent jank
  useEffect(() => {
    new Image().src = placeholder;
  }, []);

  const [user, setUser] = useState<User | null>(null);
  const [sideBar, setSideBar] = useState(SideBarType.ITEM);
  const [content, setContent] = useState(ContentType.LEDGER);
  const history = useRef([ContentType.LEDGER]);
  const collectionItems = flattenDadDb(filteredDb);

  const [selectedCollectionItemId, setSelectedCollectionItemId] = useState(
    getDefaultItemId(filteredDb),
  );

  const selectedCollectionItem = selectItemOrDefault(
    collectionItems,
    selectedCollectionItemId,
  );

  useEffect(() => {
    function commit() {
      if (user?.uid) {
        void saveToFirestore(user.uid, log).then(() => {
          console.log("[Firestore] Wrote to Firestore.");
        });
      }
    }

    const timeoutId = setTimeout(commit, 2500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [user, log]);

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
  }

  function onNavigate(content: ContentType, group?: MasterGroup) {
    setContent(pushHistory(content));
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

    // add user state listener
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log("[Auth] State changed.", { ...user });
      setUser(user);
      if (user) {
        const data = await fetchFromFirestore(user.uid);
        if (data) {
          console.log("Fetched Collection from Firestore...", data);

          const dataPatched = runPreV170Migrations({
            ...initStore(), // mixin legacy
            ...data,
          });

          saveCollection(dataPatched.collectionLog);
          saveVersion(VERSION);

          dispatch({
            type: CollectionActionType.RELOAD,
            collection: dataPatched.collectionLog,
          });
        }
      }
    });

    return () => {
      console.log("[Auth] Unsubscribing...");
      unsubscribe();
    };
  }, []);

  return (
    <Shell
      header={
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
                <NavMenu activeGroup={group} />
              </nav>
              <div className={styles.HeaderAccountWidgets}>
                <Progress
                  totalCollected={itemsCollected}
                  collectionSize={itemsTotal}
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
      }
      sidebar={
        <>
          {sideBar === SideBarType.CONFIG && <ConfigSidebar />}
          {sideBar === SideBarType.ITEM && (
            <Suspense fallback={<ItemSidebarSkeleton />}>
              <Await resolve={dbPromise}>
                <ItemSidebar collectionItem={selectedCollectionItem} />
              </Await>
            </Suspense>
          )}
        </>
      }
      main={
        <>
          {content === ContentType.LEDGER && (
            <Suspense fallback={<LedgerSkeleton />}>
              <Await resolve={dbPromise}>
                <Ledger
                  collections={filteredDb.collections}
                  openCollections={vm.openCollections}
                  onClickItem={onClickItem}
                  onCollectionChange={(collectionId, isOpen) => {
                    setVm((vm) => ({
                      ...vm,
                      openCollections: toggleValueInArray(
                        vm.openCollections,
                        collectionId,
                        isOpen,
                      ),
                    }));
                  }}
                />
              </Await>
            </Suspense>
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
        </>
      }
      stickyBottom={
        <>
          {content === ContentType.LEDGER && (
            <Progress
              totalCollected={itemsCollected}
              collectionSize={itemsTotal}
            />
          )}
        </>
      }
      footer={
        <>
          <DiscordInvite />
          <VersionInfo />
        </>
      }
    />
  );
}

export default Application;
