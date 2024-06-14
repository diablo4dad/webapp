import Authenticate, { AuthGiant } from "./Authenticate";
import styles from "./MobileMenu.module.css";
import { User } from "firebase/auth";
import Account from "./components/Account";
import React from "react";
import { ContentType, MasterGroup } from "./common";

type Props = {
  onNavigate: (place: ContentType, group?: MasterGroup) => void;
  onAuth: (giant: AuthGiant) => void;
  onLogout: () => void;
  currentUser: User | null;
};

function MobileMenu({ onNavigate, onAuth, currentUser, onLogout }: Props) {
  return (
    <div className={styles.MobileMenu}>
      <button
        className={styles.MobileMenuLink}
        onClick={() => onNavigate(ContentType.LEDGER, MasterGroup.GENERAL)}
      >
        Essential Collection
      </button>
      <button
        className={styles.MobileMenuLink}
        onClick={() => onNavigate(ContentType.LEDGER, MasterGroup.SEASONS)}
      >
        Seasons
      </button>
      <button
        className={styles.MobileMenuLink}
        onClick={() => onNavigate(ContentType.LEDGER, MasterGroup.SHOP_ITEMS)}
      >
        Tejal's Shop
      </button>
      <button
        className={styles.MobileMenuLink}
        onClick={() => onNavigate(ContentType.LEDGER, MasterGroup.PROMOTIONAL)}
      >
        Promotion
      </button>
      <button
        className={styles.MobileMenuLink}
        onClick={() => onNavigate(ContentType.CONFIG)}
      >
        Settings
      </button>
      <div className={styles.MobileMenuAccount}>
        {currentUser === null && <Authenticate onAuth={onAuth} />}
        {currentUser && (
          <Account currentUser={currentUser} onLogout={onLogout} />
        )}
      </div>
    </div>
  );
}

export default MobileMenu;
