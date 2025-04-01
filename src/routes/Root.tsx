import React, {
  createRef,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from "react";
import MobileCloseButton from "../components/MobileCloseButton";
import i18n from "../i18n";
import logo from "../image/logo/d4ico_x1.png";
import MobileHeader from "../layout/MobileHeader";
import MobileMenu from "../layout/MobileMenu";
import { ConfigMenu } from "../settings/ConfigMenu";

import styles from "./Root.module.css";
import ConfigSidebar from "../settings/ConfigSidebar";
import Progress from "../components/Progress";
import { Gear, Hamburger } from "../components/Icons";
import Button, { BtnColours } from "../components/Button";
import Authenticate, { Orientation } from "../auth/Authenticate";

import Account, { Direction } from "../auth/Account";
import { ContentType, SideBarType } from "../common";
import NavMenu from "../layout/NavMenu";
import { selectItemOrDefault } from "../data/reducers";
import { countAllItemsDabDb } from "../data/aggregate";
import { useCollection } from "../collection/context";
import {
  countItemInDbHidden,
  countItemInDbOwned,
} from "../collection/aggregate";
import placeholder from "../image/placeholder.webp";
import Shell from "../layout/Shell";
import { VersionInfo } from "../components/VersionPanel";
import { DiscordInvite } from "../components/DiscordPanel";
import { useData } from "../data/context";
import ItemSidebarSkeleton from "../collection/ItemSidebarSkeleton";
import { Outlet } from "react-router-dom";
import ItemSidebar from "../collection/ItemSidebar";
import { useAuth } from "../auth/context";
import Search from "../components/Search";

function Root(): ReactElement<HTMLDivElement> {
  const { countedDb, db, searchTerm, setSearchTerm, group, focusItemId } =
    useData();
  const log = useCollection();
  const { user, signIn, signOut } = useAuth();

  const itemsCollected = countItemInDbOwned(log, countedDb);
  const itemsTotal =
    countAllItemsDabDb(countedDb) - countItemInDbHidden(log, countedDb);

  // preload to prevent jank
  useEffect(() => {
    new Image().src = placeholder;
  }, []);

  const nav = createRef<HTMLDivElement>();
  const [navOpen, setNavOpen] = useState(false);

  const [sideBar, setSideBar] = useState(SideBarType.ITEM);
  const [content, setContent] = useState(ContentType.LEDGER);
  const history = useRef([ContentType.LEDGER]);

  const focusItem = selectItemOrDefault(db.collections, focusItemId);

  function onToggleConfig() {
    setSideBar(
      sideBar === SideBarType.CONFIG ? SideBarType.ITEM : SideBarType.CONFIG,
    );
  }

  function onNavigate(content: ContentType) {
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
              <img
                className={styles.HeaderIcon}
                src={logo}
                alt={i18n.gameName}
              />
              <div className={styles.HeaderInfo}>
                <div className={styles.HeaderInfoName}>{i18n.siteTitle}</div>
                <div className={styles.HeaderInfoTagLine}>
                  {i18n.siteTagLine}
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
                  ref={nav}
                  open={navOpen}
                  setOpen={setNavOpen}
                  activeGroup={group}
                />
              </nav>
              <div className={styles.HeaderAccountWidgets}>
                <Search
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onClear={() => setSearchTerm("")}
                />
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
      settingsBar={<ConfigMenu />}
      sidebar={
        <>
          {sideBar === SideBarType.CONFIG && <ConfigSidebar />}
          {sideBar === SideBarType.ITEM && focusItemId === -1 && (
            <ItemSidebarSkeleton />
          )}
          {sideBar === SideBarType.ITEM && focusItemId !== -1 && (
            <ItemSidebar collectionItem={focusItem} />
          )}
        </>
      }
      main={
        <>
          {content === ContentType.LEDGER && <Outlet />}
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

export default Root;
