import React, { ReactElement, useEffect, useRef, useState } from "react";
import { DadCollection, DadCollectionItem } from "./data";
import logo from "./image/d4ico.png";

import styles from "./Application.module.css";
import Ledger from "./Ledger";
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
import NavMenu from "./NavMenu";
import { selectItemOrDefault } from "./data/reducers";
import { filterDb } from "./data/filters";
import { flattenDadDb } from "./data/transforms";
import { countAllItemsDabDb } from "./data/aggregate";
import { getDefaultItemId } from "./data/getters";
import { useCollection } from "./collection/context";
import { useSettings } from "./settings/context";
import {
  getViewModel,
  saveCollection,
  saveSettings,
  saveViewModel,
} from "./store/local";
import { countItemInDbOwned } from "./collection/aggregate";
import placeholder from "./image/placeholder.webp";
import { toggleValueInArray } from "./common/arrays";
import { useLoaderData } from "react-router-dom";
import { LoaderPayload } from "./routes/CollectionLog";
import { fetchFromFirestore, saveToFirestore } from "./store/firestore";
import Shell from "./Shell";

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

export type ViewModel = {
  openCollections: number[];
};

function Application(): ReactElement<HTMLDivElement> {
  const { db, masterGroup } = useLoaderData() as LoaderPayload;
  const log = useCollection();
  const settings = useSettings();

  const [vm, setVm] = useState<ViewModel>(getViewModel());

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
  const filteredDb = filterDb(db, settings, log);
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
          saveCollection(data.collectionLog);
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
                <NavMenu activeGroup={masterGroup} />
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
      }
      sidebar={
        <div className={styles.SidebarLayout}>
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
      }
      main={
        <>
          {content === ContentType.LEDGER && (
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
      footerSticky={
        <>
          {content === ContentType.LEDGER && (
            <Progress
              totalCollected={countItemInDbOwned(log, filteredDb)}
              collectionSize={countAllItemsDabDb(filteredDb)}
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
