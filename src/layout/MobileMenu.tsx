import Authenticate, { AuthGiant } from "../auth/Authenticate";
import styles from "./MobileMenu.module.css";
import Account from "../auth/Account";
import React from "react";
import { ContentType, MasterGroup } from "../common";
import { Link } from "react-router-dom";
import { generateUrl } from "../routes/CollectionLog";
import { DadUser } from "../auth/type";

type Props = {
  onNavigate: (place: ContentType, group?: MasterGroup) => void;
  onAuth: (giant: AuthGiant) => void;
  onLogout: () => void;
  currentUser?: DadUser;
};

function MobileMenu({ onNavigate, onAuth, currentUser, onLogout }: Props) {
  return (
    <div className={styles.MobileMenu}>
      <Link
        className={styles.MobileMenuLink}
        to={generateUrl(MasterGroup.GENERAL)}
        onClick={() => onNavigate(ContentType.LEDGER)}
      >
        Essential Collection
      </Link>
      <Link
        className={styles.MobileMenuLink}
        to={generateUrl(MasterGroup.SEASONS)}
        onClick={() => onNavigate(ContentType.LEDGER)}
      >
        Seasons
      </Link>
      <Link
        className={styles.MobileMenuLink}
        to={generateUrl(MasterGroup.CHALLENGE)}
        onClick={() => onNavigate(ContentType.LEDGER)}
      >
        Challenges
      </Link>
      <Link
        className={styles.MobileMenuLink}
        to={generateUrl(MasterGroup.SHOP_ITEMS)}
        onClick={() => onNavigate(ContentType.LEDGER)}
      >
        Tejal's Shop
      </Link>
      <Link
        className={styles.MobileMenuLink}
        to={generateUrl(MasterGroup.PROMOTIONAL)}
        onClick={() => onNavigate(ContentType.LEDGER)}
      >
        Promotional
      </Link>
      <Link
        className={styles.MobileMenuLink}
        to={generateUrl(MasterGroup.UNIVERSAL)}
        onClick={() => onNavigate(ContentType.LEDGER)}
      >
        Universal
      </Link>
      <button
        className={styles.MobileMenuLink}
        onClick={() => onNavigate(ContentType.CONFIG)}
      >
        Settings
      </button>
      <div className={styles.MobileMenuAccount}>
        {currentUser === undefined && <Authenticate onAuth={onAuth} />}
        {currentUser && (
          <Account currentUser={currentUser} onLogout={onLogout} />
        )}
      </div>
    </div>
  );
}

export default MobileMenu;
