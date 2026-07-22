import { Link, useLocation } from "react-router-dom";
import type { DadUser } from "../../services/auth";
import { Close } from "../../shared/ui/Icons";
import { AuthActions } from "./auth";
import {
  getActiveNavigationId,
  getNavigationItems,
} from "./header-navigation";
import { MobileSettingsLayout } from "./mobile-settings-layout";
import styles from "./mobile-menu.module.css";

type Props = {
  onClose: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
  user?: DadUser;
};

type HeaderProps = {
  onClose: () => void;
};

type BodyProps = {
  onClose: () => void;
};

type FooterProps = {
  onSignIn: () => void;
  onSignOut: () => void;
  user?: DadUser;
};

function MobileMenu({
  onClose,
  onSignIn,
  onSignOut,
  user,
}: Props) {
  return (
    <MobileSettingsLayout
      onClose={onClose}
      header={<Header onClose={onClose} />}
      body={<Body onClose={onClose} />}
      footer={
        <Footer
          onSignIn={onSignIn}
          onSignOut={onSignOut}
          user={user}
        />
      }
    />
  );
}

function Header({ onClose }: HeaderProps) {
  return (
    <>
      <div className={styles.MobileMenuTitle}>Menu</div>
      <button
        className={styles.MobileMenuClose}
        onClick={onClose}
        aria-label="Close menu"
      >
        <Close />
      </button>
    </>
  );
}

function Body({ onClose }: BodyProps) {
  const { pathname } = useLocation();
  const activeId = getActiveNavigationId(pathname);

  return (
    <nav className={styles.MobileMenuNav} aria-label="Mobile navigation">
      {getNavigationItems().map((item) => {
        const isActive = item.id === activeId;

        return (
          <Link
            key={item.id}
            className={
              isActive
                ? styles.MobileMenuNavLinkActive
                : styles.MobileMenuNavLink
            }
            to={item.to}
            aria-current={isActive ? "page" : undefined}
            onClick={onClose}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Footer({
  onSignIn,
  onSignOut,
  user,
}: FooterProps) {
  return (
    <div className={styles.MobileMenuAccount}>
      <div className={styles.MobileMenuAccountTitle}>Account</div>
      <AuthActions
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        user={user}
      />
    </div>
  );
}

export { MobileMenu };
