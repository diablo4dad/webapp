import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import { ItemQuality, type CollectionItem, type Item } from "../../services/data";
import styles from "./item-sidebar.module.css";
import { ItemSidebar } from "./view";

vi.mock("../../services/bucket", () => ({
  getIcon: (fileName: string) => `/assets/${fileName}`,
}));

vi.mock("../../shared/ui/LazyLoadImageFallback", () => ({
  FallbackLazyImage: ({
    alt,
    className,
    src,
  }: {
    alt: string;
    className?: string;
    src?: string;
  }) => <img alt={alt} className={className} src={src} />,
}));

function item(id: number, name: string): Item {
  return {
    icon: `icons/${id}.webp`,
    id,
    invImages: [],
    itemType: {
      id: 1,
      name: "Sword",
    },
    itemQuality: ItemQuality.MAGIC,
    name,
    similarItems: [],
    similarItemsRefs: [],
    usableByClass: [1, 1, 1, 1, 1, 1, 1, 1],
  };
}

describe("item sidebar", () => {
  test("links collection item ids to database items", async () => {
    const user = userEvent.setup();
    const collectionItem: CollectionItem = {
      claim: "Drop",
      id: 10,
      items: [
        item(101, "Azure Blade"),
        item(202, "Crimson Blade"),
      ],
    };

    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route
            path="/"
            element={<ItemSidebar collectionItem={collectionItem} />}
          />
          <Route path="/database/:itemId" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    const firstLink = screen.getByRole("link", {
      name: "View database item 101",
    });
    const secondLink = screen.getByRole("link", {
      name: "View database item 202",
    });
    const metaRow = firstLink.closest("div");

    expect(metaRow).toHaveTextContent("Item ID: 101, 202");
    expect(firstLink).toHaveAttribute("href", "/database/101");
    expect(secondLink).toHaveAttribute("href", "/database/202");
    expect(firstLink).toHaveClass(styles.ItemDatabaseLink);
    expect(secondLink).toHaveClass(styles.ItemDatabaseLink);

    await user.click(firstLink);

    expect(screen.getByTestId("location")).toHaveTextContent(
      "/database/101:reset",
    );
  });
});

function LocationProbe() {
  const location = useLocation();
  const state = location.state as { resetDatabaseScroll?: boolean } | null;

  return (
    <div data-testid="location">
      {location.pathname}:{state?.resetDatabaseScroll ? "reset" : "preserve"}
    </div>
  );
}
