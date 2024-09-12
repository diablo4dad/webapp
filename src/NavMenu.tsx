import { ForwardedRef, forwardRef, useState } from "react";
import styles from "./NavMenu.module.css";
import { MasterGroup } from "./common";
import GeneralIcon from "./image/goblin.webp";
import CashShopIcon from "./image/money.webp";
import PromoIcon from "./image/chest.webp";
import SeasonIcon from "./image/season.webp";
import ChallengeIcon from "./image/challenge.webp";
import GlobalIcon from "./image/global.webp";
import { ChevronRight } from "./Icons";
import { NavLink } from "react-router-dom";
import { generateUrl } from "./routes/CollectionLog";
import classNames from "classnames";

type Props = {
  activeGroup: MasterGroup;
  onChange?: (newGroup: MasterGroup) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
};

type NavItemMeta = {
  icon: string;
  name: string;
  desc: string;
  order: number;
};

const NAV_ITEM_META: Map<MasterGroup, NavItemMeta> = new Map([
  [
    MasterGroup.GENERAL,
    {
      name: "Essential Collection",
      desc: "Transmogs acquired through gameplay and are generally part of the core game.",
      icon: GeneralIcon,
      order: 1,
    },
  ],
  [
    MasterGroup.SEASONS,
    {
      name: "Seasons",
      desc: "Transmogs acquired through completing the Battle Pass and Seasons Journey.",
      icon: SeasonIcon,
      order: 2,
    },
  ],
  [
    MasterGroup.CHALLENGE,
    {
      name: "Challenges",
      desc: "Transmogs earned through completing challenges and feats of strength.",
      icon: ChallengeIcon,
      order: 3,
    },
  ],
  [
    MasterGroup.SHOP_ITEMS,
    {
      name: "Tejal's Shop",
      desc: "Transmogs purchased through the cash shop for real life money, hello whales!",
      icon: CashShopIcon,
      order: 4,
    },
  ],
  [
    MasterGroup.PROMOTIONAL,
    {
      name: "Promotional",
      desc: "Transmogs acquired through channel partner promotions like Twitch Drops.",
      icon: PromoIcon,
      order: 5,
    },
  ],
  [
    MasterGroup.UNIVERSAL,
    {
      name: "Universal",
      desc: "Every transmog in one collection categorised by item type.",
      icon: GlobalIcon,
      order: 6,
    },
  ],
]);

const DEFAULT_META: NavItemMeta = {
  name: "missing",
  desc: "missing",
  icon: "missing.webp",
  order: -1,
};

const NavMenu = forwardRef(function NavMenu(
  { activeGroup, onChange, open, setOpen }: Props,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const [preview, setPreview] = useState<MasterGroup | undefined>();
  const meta = NAV_ITEM_META.get(preview ?? activeGroup) ?? DEFAULT_META;
  const keys = Array.from(NAV_ITEM_META.keys());

  const className = classNames({
    [styles.Nav]: true,
    [styles.NavOpen]: open,
  });

  return (
    <div className={className} onClick={() => setOpen(!open)} ref={ref}>
      <div className={styles.NavActive}>
        <button className={styles.NavBtn}>
          <span className={styles.NavBtnIcon}>
            <img src={meta.icon}></img>
          </span>
          <span className={styles.NavBtnText}>{meta.name}</span>
          <span className={styles.NavBtnArrow}>
            <ChevronRight />
          </span>
        </button>
        <div className={styles.NavActiveDesc}>{meta.desc}</div>
      </div>
      <div className={styles.Menu} hidden={!open}>
        {keys.map((menuItem) => {
          const innerMeta = NAV_ITEM_META.get(menuItem) ?? DEFAULT_META;
          return (
            <NavLink
              to={generateUrl(menuItem)}
              key={menuItem}
              className={() =>
                classNames({
                  [styles.MenuItem]: true,
                  [styles.MenuItemActive]: activeGroup === menuItem,
                })
              }
              onClick={() => {
                if (onChange) {
                  onChange(menuItem);
                }
              }}
              onMouseEnter={() => setPreview(menuItem)}
              onMouseLeave={() => setPreview(undefined)}
            >
              <span className={styles.MenuItemIcon}>
                <img src={innerMeta.icon}></img>
              </span>
              <span className={styles.MenuItemText}>{innerMeta.name}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
});

export default NavMenu;
