import { useState } from "react";
import styles from "./NavMenu.module.css";
import { MasterGroup } from "./common";
import GeneralIcon from "./image/goblin.webp";
import CashShopIcon from "./image/money.webp";
import PromoIcon from "./image/chest.webp";
import SeasonIcon from "./image/season.webp";
import ChallengeIcon from "./image/challenge.webp";
import { ChevronRight } from "./Icons";
import { NavLink } from "react-router-dom";
import { generateUrl } from "./routes/CollectionLog";
import classNames from "classnames";

type Props = {
  activeGroup: MasterGroup;
  onChange?: (newGroup: MasterGroup) => void;
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
      name: "Challenge",
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
]);

const DEFAULT_META: NavItemMeta = {
  name: "missing",
  desc: "missing",
  icon: "missing.webp",
  order: -1,
};

function NavMenu({ activeGroup, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(activeGroup);
  const meta = NAV_ITEM_META.get(active) ?? DEFAULT_META;
  const keys = Array.from(NAV_ITEM_META.keys());

  const className = classNames({
    [styles.Nav]: true,
    [styles.NavOpen]: open,
  });

  return (
    <div className={className}>
      <div className={styles.NavActive}>
        <button className={styles.NavBtn} onClick={() => setOpen(!open)}>
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
                setOpen(false);

                if (onChange) {
                  onChange(menuItem);
                }
              }}
              onMouseEnter={() => setActive(menuItem)}
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
}

export default NavMenu;
