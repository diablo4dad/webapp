import {useState} from "react";
import styles from "./NavMenu.module.css"
import {MasterGroup} from "./common";
import GeneralIcon from "./image/goblin.webp"
import CashShopIcon from "./image/money.webp"
import PromoIcon from "./image/chest.webp"
import SeasonIcon from "./image/season.webp"
// import ChallengeIcon from "./image/challenge.webp"
import {ChevronRight} from "./Icons";

type Props = {
    activeGroup: MasterGroup,
    onChange: (newGroup: MasterGroup) => void,
}

type NavItemMeta = {
    icon: string,
    name: string,
    desc: string,
    order: number,
}

const NAV_ITEM_META: Map<MasterGroup, NavItemMeta> = new Map([
    [MasterGroup.GENERAL, {
        name: "Essential Collection",
        desc: "Transmogs acquired through gameplay and are generally part of the core game.",
        icon: GeneralIcon,
        order: 1,
    }],
    [MasterGroup.SEASONS, {
        name: "Seasons",
        desc: "Transmogs acquired through completing the Battle Pass and Seasons Journey.",
        icon: SeasonIcon,
        order: 2,
    }],
    [MasterGroup.SHOP_ITEMS, {
        name: "Tejal's Shop",
        desc: "Transmogs purchased through the cash shop for real life money, hello whales!",
        icon: CashShopIcon,
        order: 3,
    }],
    [MasterGroup.PROMOTIONAL, {
        name: "Promotional",
        desc: "Transmogs acquired through channel partner promotions like Twitch Drops.",
        icon: PromoIcon,
        order: 4,
    }],
    // [MasterGroup.CHALLENGE, {
    //     name: "Challenge",
    //     desc: "Transmogs earned through completing challenges and feats of strength.",
    //     icon: ChallengeIcon,
    //     order: 5,
    // }]
]);

const DEFAULT_META: NavItemMeta = {
    name: "missing",
    desc: "missing",
    icon: "missing.webp",
    order: -1,
}

function NavMenu({ activeGroup, onChange }: Props) {
    const [open, setOpen] = useState(false);
    const meta = NAV_ITEM_META.get(activeGroup) ?? DEFAULT_META;
    const otherNavItems = Array
        .from(NAV_ITEM_META.keys())
        .filter(m => m !== activeGroup)
        .sort((a, b) => {
            const am = NAV_ITEM_META.get(a) ?? DEFAULT_META;
            const bm = NAV_ITEM_META.get(b) ?? DEFAULT_META;
            if (am.order < bm.order) return -1;
            if (am.order > bm.order) return 1;
            return 0;
        });

    return (
        <div className={styles.Nav}>
            <div className={styles.NavActive}>
                <button className={styles.NavBtn} onClick={() => setOpen(!open)}>
                    <span className={styles.NavBtnIcon}><img src={meta.icon}></img></span>
                    <span className={styles.NavBtnText}>{meta.name}</span>
                    <span className={styles.NavBtnArrow}><ChevronRight /></span>
                </button>
                <div className={styles.NavActiveDesc}>{meta.desc}</div>
            </div>
            <div className={styles.Menu} hidden={!open}>
                {otherNavItems.map(menuItem => {
                    const innerMeta = NAV_ITEM_META.get(menuItem) ?? DEFAULT_META;
                    return (
                        <div key={menuItem} className={styles.MenuItem} onClick={() => onChange(menuItem)}>
                            <span className={styles.MenuItemIcon}>
                                <img src={innerMeta.icon}></img>
                            </span>
                            <span className={styles.MenuItemText}>{innerMeta.name}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default NavMenu;
