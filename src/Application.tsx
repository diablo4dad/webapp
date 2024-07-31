import React, {
  createRef,
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
import Authenticate, { Orientation } from "./Authenticate";
import MobileMenu from "./MobileMenu";
import MobileCloseButton from "./MobileCloseButton";
import MobileHeader from "./MobileHeader";

import Account, { Direction } from "./components/Account";
import { ContentType, MasterGroup, SideBarType } from "./common";
import NavMenu from "./NavMenu";
import { selectItemOrDefault } from "./data/reducers";
import { flattenDadDb } from "./data/transforms";
import { countAllItemsDabDb } from "./data/aggregate";
import { getDefaultItemId } from "./data/getters";
import {
  useCollection,
} from "./collection/context";
import { useSettings } from "./settings/context";
import {
  getViewModel,
  saveSettings,
  saveViewModel,
} from "./store/local";
import { countItemInDbOwned } from "./collection/aggregate";
import placeholder from "./image/placeholder.webp";
import { toggleValueInArray } from "./common/arrays";
import Shell from "./Shell";
import { VersionInfo } from "./components/VersionPanel";
import { DiscordInvite } from "./components/DiscordPanel";
import { useData } from "./data/context";
import ItemSidebarSkeleton from "./ItemSidebarSkeleton";
import LedgerSkeleton from "./LedgerSkeleton";
import { Await, useLoaderData } from "react-router-dom";
import { LoaderPayload } from "./routes/CollectionLog";
import ItemSidebar from "./ItemSidebar";
import {useAuth} from "./auth/context";

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
  const settings = useSettings();
  const { user, signIn, signOut } = useAuth();

  const [vm, setVm] = useState<ViewModel>(getViewModel());

  const itemsCollected = countItemInDbOwned(log, countedDb);
  const itemsTotal = countAllItemsDabDb(countedDb);

  // persist settings
  saveViewModel(vm);
  saveSettings(settings);

  // preload to prevent jank
  useEffect(() => {
    new Image().src = placeholder;
  }, []);

  const nav = createRef<HTMLDivElement>();
  const [navOpen, setNavOpen] = useState(false);

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

  return (
    <Shell
      onClick={(e) => {
        // @ts-ignore
        if (!nav.current?.contains(e.target)) {
          setNavOpen(false);
        }
      }}
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
                <NavMenu ref={nav} open={navOpen} setOpen={setNavOpen} activeGroup={group} />
              </nav>
              <div className={styles.HeaderAccountWidgets}>
                <Progress
                  totalCollected={itemsCollected}
                  collectionSize={itemsTotal}
                />
                {user === undefined && (
                  <Authenticate orientation={Orientation.ROW} onAuth={signIn} />
                )}
                {user !== undefined && (
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
