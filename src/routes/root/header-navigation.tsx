import { Link, useLocation } from "react-router-dom";
import styles from "./header-navigation.module.css";

type NavigationItem = {
  id: "tracker" | "database" | "stats";
  label: string;
  to: string;
};

function HeaderNavigation() {
  const { pathname } = useLocation();
  const items = getNavigationItems();

  const activeId = getActiveNavigationId(pathname);

  return (
    <nav className={styles.HeaderNavigation} aria-label="Main navigation">
      {items.map((item) => {
        const isActive = item.id === activeId;

        return (
          <Link
            key={item.id}
            className={
              isActive
                ? styles.HeaderNavigationLinkActive
                : styles.HeaderNavigationLink
            }
            to={item.to}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function getNavigationItems(): NavigationItem[] {
  return [
    {
      id: "tracker",
      label: "Tracker",
      to: "/",
    },
    {
      id: "stats",
      label: "Stats",
      to: "/stats",
    },
    {
      id: "database",
      label: "Database",
      to: "/database",
    },
  ];
}

function getActiveNavigationId(pathname: string): NavigationItem["id"] {
  if (pathname.startsWith("/database")) {
    return "database";
  }

  if (pathname.startsWith("/stats")) {
    return "stats";
  }

  return "tracker";
}

export { HeaderNavigation, getActiveNavigationId, getNavigationItems };
