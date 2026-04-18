import React, { ReactElement, useEffect, useRef, useState } from "react";
import MobileCloseButton from "../components/MobileCloseButton";
import i18n from "../i18n";
import logo from "../image/logo-crop-2x.png";
import MobileHeader from "../layout/MobileHeader";
import MobileMenu from "../layout/MobileMenu";

import styles from "./Root.module.css";
import ConfigSidebar from "../settings/ConfigSidebar";
import Progress from "../components/Progress";
import { Hamburger, SidebarLeft, SidebarRight } from "../components/Icons";
import Button, { BtnColours } from "../components/Button";
import Authenticate, { Orientation } from "../auth/Authenticate";

import Account, { Direction } from "../auth/Account";
import { ContentType } from "../common";
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
import { Outlet } from "react-router-dom";
import { useAuth } from "../auth/context";
import Search from "../components/Search";

function Root(): ReactElement<HTMLDivElement> {
  const {
    countedDb,
    searchTerm,
    setSearchTerm,
    setSidebarVisibility,
    sidebarVisibility,
  } = useData();
  const log = useCollection();
  const { user, signIn, signOut } = useAuth();

  const itemsCollected = countItemInDbOwned(log, countedDb);
  const itemsTotal =
    countAllItemsDabDb(countedDb) - countItemInDbHidden(log, countedDb);

  // preload to prevent jank
  useEffect(() => {
    new Image().src = placeholder;
  }, []);

  const [content, setContent] = useState(ContentType.LEDGER);
  const history = useRef([ContentType.LEDGER]);

  function onToggleItemSidebar() {
    setSidebarVisibility({
      ...sidebarVisibility,
      showItem: !sidebarVisibility.showItem,
    });
  }

  function onToggleConfig() {
    setSidebarVisibility({
      ...sidebarVisibility,
      showConfig: !sidebarVisibility.showConfig,
    });
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
      header={
        <header className={styles.Header}>
          <div className={styles.HeaderBrand}>
            <img className={styles.HeaderIcon} src={logo} alt={i18n.gameName} />
            <div className={styles.HeaderInfo}>
              <div className={styles.HeaderInfoName}>
                <span className={styles.HeaderInfoNameAccent}>Diablo IV</span>{" "}
                <span>Dad</span>
              </div>
              <div className={styles.HeaderInfoTagLine}>{i18n.siteTagLine}</div>
            </div>
          </div>
          <div className={styles.HeaderSearch}>
            <Search
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={() => setSearchTerm("")}
            />
            <div className={styles.HeaderButtons}>
              <Button
                onClick={onToggleItemSidebar}
                pressed={sidebarVisibility.showItem}
                showOnly={"desktop"}
                colour={BtnColours.Dark}
              >
                <SidebarLeft />
              </Button>
              <Button
                onClick={onToggleConfig}
                pressed={sidebarVisibility.showConfig}
                showOnly={"desktop"}
                colour={BtnColours.Dark}
              >
                <SidebarRight />
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
            <div className={styles.HeaderAuth}>
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
        </header>
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
