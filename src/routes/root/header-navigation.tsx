import { Link, useLocation } from "react-router-dom";
import styles from "./header-navigation.module.css";

type NavigationItem = {
  id: "collection" | "database";
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
      id: "collection",
      label: "Collection",
      to: "/",
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

  return "collection";
}

export { HeaderNavigation, getActiveNavigationId, getNavigationItems };
