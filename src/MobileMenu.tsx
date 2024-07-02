import Authenticate, { AuthGiant } from "./Authenticate";
import styles from "./MobileMenu.module.css";
import { User } from "firebase/auth";
import Account from "./components/Account";
import React from "react";
import { ContentType, MasterGroup } from "./common";
import { Link } from "react-router-dom";

type Props = {
  onNavigate: (place: ContentType, group?: MasterGroup) => void;
  onAuth: (giant: AuthGiant) => void;
  onLogout: () => void;
  currentUser: User | null;
};

function MobileMenu({ onNavigate, onAuth, currentUser, onLogout }: Props) {
  return (
    <div className={styles.MobileMenu}>
      <Link
        className={styles.MobileMenuLink}
        to={"/transmogs/" + MasterGroup.GENERAL.toLowerCase()}
        onClick={() => onNavigate(ContentType.LEDGER)}
      >
        Essential Collection
      </Link>
      <Link
        className={styles.MobileMenuLink}
        to={"/transmogs/" + MasterGroup.SEASONS.toLowerCase()}
        onClick={() => onNavigate(ContentType.LEDGER)}
      >
        Seasons
      </Link>
      <Link
        className={styles.MobileMenuLink}
        to={"/transmogs/" + MasterGroup.SHOP_ITEMS.toLowerCase()}
        onClick={() => onNavigate(ContentType.LEDGER)}
      >
        Tejal's Shop
      </Link>
      <Link
        className={styles.MobileMenuLink}
        to={"/transmogs/" + MasterGroup.PROMOTIONAL.toLowerCase()}
        onClick={() => onNavigate(ContentType.LEDGER)}
      >
        Promotional
      </Link>
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
