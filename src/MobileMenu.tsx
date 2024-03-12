import Authenticate, {AuthGiant} from "./Authenticate";
import styles from "./MobileMenu.module.css"
import {ContentType} from "./config";
import {User} from "firebase/auth";
import Account from "./Account";
import React from "react";
import {MasterGroup} from "./common";

type Props = {
    onNavigate: (place: ContentType, group?: MasterGroup) => void,
    onAuth: (giant: AuthGiant) => void,
    onLogout: () => void,
    currentUser: User | null,
}

function MobileMenu({ onNavigate, onAuth, currentUser, onLogout }: Props) {
    return (
        <div className={styles.MobileMenu}>
            <button className={styles.MobileMenuLink} onClick={() => onNavigate(ContentType.LEDGER, MasterGroup.GENERAL)}>General
            </button>
            <button className={styles.MobileMenuLink} onClick={() => onNavigate(ContentType.LEDGER, MasterGroup.SHOP_ITEMS)}>Cash Shop
            </button>
            <button className={styles.MobileMenuLink} onClick={() => onNavigate(ContentType.LEDGER, MasterGroup.PROMOTIONAL)}>Promotion
            </button>
            <button className={styles.MobileMenuLink} onClick={() => onNavigate(ContentType.CONFIG)}>Settings</button>
            <div className={styles.MobileMenuAccount}>
                {currentUser === null &&
                    <Authenticate onAuth={onAuth}/>
                }
                {currentUser &&
                    <Account currentUser={currentUser} onLogout={onLogout}/>
                }
            </div>
        </div>
    );
}

export default MobileMenu;
