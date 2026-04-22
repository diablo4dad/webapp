import React, { ReactElement, useEffect, useRef, useState } from "react";
import { Outlet } from "react-router-dom";

import Account, { Direction } from "../auth/Account";
import Authenticate, { Orientation } from "../auth/Authenticate";
import { useAuth } from "../auth/context";
import {
  countItemInDbHidden,
  countItemInDbOwned,
} from "../collection/aggregate";
import { useCollection } from "../collection/context";
import { ContentType } from "../common";
import Button, { BtnColours } from "../components/Button";
import { DiscordInvite } from "../components/DiscordPanel";
import {
  Close,
  Hamburger,
  SidebarLeft,
  SidebarRight,
} from "../components/Icons";
import Search from "../components/Search";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/Tooltip";
import { VersionInfo } from "../components/VersionPanel";
import { countAllItemsDabDb } from "../data/aggregate";
import { useData } from "../data/context";
import i18n from "../i18n";
import logo from "../image/logo-crop-2x.png";
import placeholder from "../image/placeholder.webp";
import Shell from "../layout/Shell";
import ConfigSidebar from "../settings/ConfigSidebar";

import styles from "./Root.module.css";

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

  function pushHistory(content: ContentType) {
    if ([ContentType.CONFIG, ContentType.SEARCH].includes(content)) {
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
            <div className={styles.HeaderLogo}>
              <img
                className={styles.HeaderIcon}
                src={logo}
                alt={i18n.gameName}
              />
            </div>
            <div className={styles.HeaderTitle}>
              <div className={styles.HeaderInfo}>
                <div className={styles.HeaderInfoName}>
                  <span className={styles.HeaderInfoNameAccent}>Diablo IV</span>{" "}
                  <span>Dad</span>
                </div>
                <div className={styles.HeaderInfoTagLine}>
                  {i18n.siteTagLine}
                </div>
              </div>
            </div>
          </div>
          <div className={styles.HeaderControls}>
            <div className={styles.HeaderSearch}>
              <Search
                value={searchTerm}
                onChange={setSearchTerm}
                onClear={() => setSearchTerm("")}
                placeholder={"Search transmogs"}
              />
            </div>
            <div className={styles.HeaderButtons}>
              <Tooltip placement={"bottom"}>
                <TooltipTrigger asChild={true}>
                  <Button
                    onClick={onToggleItemSidebar}
                    pressed={sidebarVisibility.showItem}
                    showOnly={"desktop"}
                    colour={BtnColours.Dark}
                  >
                    <SidebarLeft />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className={styles.HeaderTooltip}>
                  {sidebarVisibility.showItem
                    ? "Hide Item Sidebar"
                    : "Show Item Sidebar"}
                </TooltipContent>
              </Tooltip>
              <Tooltip placement={"bottom"}>
                <TooltipTrigger asChild={true}>
                  <Button
                    onClick={onToggleConfig}
                    pressed={sidebarVisibility.showConfig}
                    showOnly={"desktop"}
                    colour={BtnColours.Dark}
                  >
                    <SidebarRight />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className={styles.HeaderTooltip}>
                  {sidebarVisibility.showConfig
                    ? "Hide Settings Sidebar"
                    : "Show Settings Sidebar"}
                </TooltipContent>
              </Tooltip>
              <Button
                onClick={() =>
                  setContent(
                    content === ContentType.CONFIG
                      ? popHistory()
                      : pushHistory(ContentType.CONFIG),
                  )
                }
                pressed={content === ContentType.CONFIG}
                showOnly={"mobile"}
              >
                <Hamburger />
              </Button>
            </div>
            <div className={styles.HeaderSpacer} />
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
          {(content === ContentType.LEDGER ||
            content === ContentType.CONFIG ||
            content === ContentType.SEARCH) && <Outlet />}
          {content === ContentType.SEARCH && (
            <div
              className={styles.MobileSearchOverlay}
              onClick={() => setContent(popHistory())}
            >
              <div
                className={styles.MobileSearchPanel}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.MobileSearchHeader}>
                  <div className={styles.MobileSearchHeading}>
                    <div className={styles.MobileSearchTitle}>
                      Transmog Search
                    </div>
                  </div>
                  <button
                    className={styles.MobileDrawerClose}
                    onClick={() => setContent(popHistory())}
                    aria-label="Close search"
                  >
                    <Close />
                  </button>
                </div>
                <div className={styles.MobileSearchBody}>
                  <div className={styles.MobileSearchField}>
                    <Search
                      value={searchTerm}
                      onChange={setSearchTerm}
                      onClear={() => setSearchTerm("")}
                      autoFocus={true}
                      placeholder={"Search transmogs"}
                    />
                  </div>
                </div>
                <div className={styles.MobileSearchActions}>
                  <Button
                    className={styles.MobileSearchActionPrimary}
                    colour={BtnColours.Dark}
                    onClick={() => setContent(popHistory())}
                  >
                    Search
                  </Button>
                  <Button
                    className={styles.MobileSearchAction}
                    colour={BtnColours.Dark}
                    onClick={() => setSearchTerm("")}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          )}
          {content === ContentType.CONFIG && (
            <div
              className={styles.MobileDrawerOverlay}
              onClick={() => setContent(popHistory())}
            >
              <aside
                className={styles.MobileDrawer}
                onClick={(e) => e.stopPropagation()}
              >
                <div className={styles.MobileDrawerHeader}>
                  <div className={styles.MobileDrawerTitle}>Settings</div>
                  <button
                    className={styles.MobileDrawerClose}
                    onClick={() => setContent(popHistory())}
                    aria-label="Close settings"
                  >
                    <Close />
                  </button>
                </div>
                <div className={styles.MobileDrawerBody}>
                  <div className={styles.MobileDrawerContent}>
                    <ConfigSidebar />
                  </div>
                  <div className={styles.MobileDrawerFooter}>
                    {user === undefined && (
                      <Authenticate
                        orientation={Orientation.ROW}
                        onAuth={signIn}
                      />
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
              </aside>
            </div>
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
