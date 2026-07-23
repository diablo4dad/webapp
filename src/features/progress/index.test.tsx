import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CollectionProvider } from "../ledger/context";
import {
  defaultSettings,
  Option,
  SettingsProvider,
  type Settings,
} from "../settings";
import type {
  Collection,
  CollectionItem,
  DadDb,
  Item,
  ItemType,
} from "../../services/data";
import {
  DataContext,
  type DataContextType,
} from "../../services/data/context";
import { MasterGroup } from "../../shared/domain";
import { Progress } from ".";

const helmType: ItemType = {
  id: 1,
  name: "Helm",
};

const noop = () => undefined;

function item(id: number): Item {
  return {
    id,
    icon: "",
    invImages: [],
    itemType: helmType,
    name: `Item ${id}`,
    similarItems: [],
    similarItemsRefs: [],
    usableByClass: [1, 1, 1, 1, 1, 1, 1, 1],
  };
}

function collectionItem(
  id: number,
  flags: Partial<Pick<CollectionItem, "outOfRotation" | "premium">> = {},
): CollectionItem {
  return {
    id,
    claim: "",
    items: [item(id)],
    ...flags,
  };
}

function collection(collectionItems: CollectionItem[]): Collection {
  return {
    category: MasterGroup.UNIVERSAL,
    id: "collection",
    name: "Collection",
    collectionItems,
    subcollections: [],
  };
}

function dataContext(): DataContextType {
  const db: DadDb = {
    collections: [
      collection([
        collectionItem(101),
        collectionItem(102, { premium: true }),
        collectionItem(103, { outOfRotation: true }),
      ]),
    ],
    itemTypes: [helmType],
    items: [item(101), item(102), item(103)],
  };

  return {
    catalogGroupSources: {},
    db,
    group: MasterGroup.UNIVERSAL,
    loadedCatalogGroups: [],
    setCatalogCategoryDb: noop,
    setDb: noop,
    switchDb: noop,
  };
}

function renderProgress(settingsOverrides: Partial<Settings> = {}) {
  const settings: Settings = {
    ...defaultSettings,
    ...settingsOverrides,
  };

  return render(
    <SettingsProvider settings={settings}>
      <CollectionProvider>
        <DataContext.Provider value={dataContext()}>
          <Progress scope={MasterGroup.UNIVERSAL} variant="dashboard" />
        </DataContext.Provider>
      </CollectionProvider>
    </SettingsProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("progress", () => {
  test("uses collection labels for carousel scopes", async () => {
    const user = userEvent.setup();

    renderProgress();

    expect(screen.getByRole("heading", { name: "Essential" }))
      .toBeInTheDocument();
    expect(screen.getByText("1 of 6")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Previous collection group" }),
    );

    expect(screen.getByRole("heading", { name: "Universal" }))
      .toBeInTheDocument();
    expect(screen.getByText("6 of 6")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Next collection group" }),
    );

    expect(screen.getByRole("heading", { name: "Essential" }))
      .toBeInTheDocument();
    expect(screen.getByText("1 of 6")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Next collection group" }),
    );

    expect(screen.getByRole("heading", { name: "Seasons" }))
      .toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Next collection group" }),
    );

    expect(screen.getByRole("heading", { name: "Challenges" }))
      .toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Next collection group" }),
    );

    expect(screen.getByRole("heading", { name: "Tejal's Shop" }))
      .toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Next collection group" }),
    );

    expect(screen.getByRole("heading", { name: "Promotional" }))
      .toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Next collection group" }),
    );

    expect(screen.getByRole("heading", { name: "Universal" }))
      .toBeInTheDocument();
    expect(screen.getByText("6 of 6")).toBeInTheDocument();
  });

  test("syncs dashboard filters with application settings", async () => {
    const user = userEvent.setup();

    renderProgress();

    const showPremium = screen.getByRole("checkbox", {
      name: "Show Premium",
    });
    const showOutOfRotation = screen.getByRole("checkbox", {
      name: "Show Out of Rotation",
    });

    expect(showPremium).toBeChecked();
    expect(showOutOfRotation).toBeChecked();

    await user.click(showPremium);
    await user.click(showOutOfRotation);

    expect(showPremium).not.toBeChecked();
    expect(showOutOfRotation).not.toBeChecked();
  });

  test("reflects disabled dashboard filters from application settings", () => {
    renderProgress({
      [Option.SHOW_PREMIUM]: false,
      [Option.SHOW_OUT_OF_ROTATION]: false,
    });

    expect(screen.getByRole("checkbox", { name: "Show Premium" }))
      .not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Show Out of Rotation" }))
      .not.toBeChecked();
  });
});
