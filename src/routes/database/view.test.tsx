import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { ItemQuality, type ItemRef } from "../../services/data";
import * as catalogStore from "../../services/store/catalog";
import {
  ALL_OPTION_VALUE,
  DEFAULT_FILTERS,
  DEFAULT_SORT_MODE,
  type ExplorerItem,
  type FilterOption,
} from "./state";
import editorStyles from "../../features/database-explorer/editor/view.module.css";
import drawerStyles from "../../features/editor/collection-item-editor.module.css";
import itemListSkeletonStyles from "../../features/database-explorer/item-list/skeleton.module.css";
import itemListStyles from "../../features/database-explorer/item-list/view.module.css";
import itemViewSkeletonStyles from "../../features/database-explorer/item-view/skeleton.module.css";
import itemViewStyles from "../../features/database-explorer/item-view/view.module.css";
import buttonStyles from "../../shared/ui/Button.module.css";
import { View } from "./view";
import layoutStyles from "./layout.module.css";
import routeStyles from "./view.module.css";

const editorApiMocks = vi.hoisted(() => ({
  importDatabaseItemFromUrl: vi.fn(),
  uploadCatalogItemIconDataUrl: vi.fn(),
}));

vi.mock("../../features/database-explorer/editor/api", async (importActual) => {
  const actual = await importActual<
    typeof import("../../features/database-explorer/editor/api")
  >();

  return {
    ...actual,
    importDatabaseItemFromUrl: editorApiMocks.importDatabaseItemFromUrl,
    uploadCatalogItemIconDataUrl: editorApiMocks.uploadCatalogItemIconDataUrl,
  };
});

const emptyOptions: FilterOption[] = [
  {
    label: "All",
    value: ALL_OPTION_VALUE,
  },
];
const itemTypeOptions: FilterOption[] = [
  {
    label: "All item types",
    value: ALL_OPTION_VALUE,
  },
  {
    label: "Sword",
    value: "1",
  },
];
const classOptions: FilterOption[] = [
  {
    label: "All classes",
    value: ALL_OPTION_VALUE,
  },
  {
    label: "Sorcerer",
    value: "2",
  },
];
const itemQualityOptions: FilterOption[] = [
  {
    label: "All item qualities",
    value: ALL_OPTION_VALUE,
  },
  {
    label: "Magic",
    value: String(ItemQuality.MAGIC),
  },
];
const originalOffsetHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetHeight",
);
const originalOffsetWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetWidth",
);

beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
    configurable: true,
    get() {
      return this.getAttribute("aria-label") === "Database item results"
        ? 680
        : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
    configurable: true,
    get() {
      return this.getAttribute("aria-label") === "Database item results"
        ? 360
        : 0;
    },
  });
});

afterAll(() => {
  if (originalOffsetHeight) {
    Object.defineProperty(
      HTMLElement.prototype,
      "offsetHeight",
      originalOffsetHeight,
    );
  }

  if (originalOffsetWidth) {
    Object.defineProperty(
      HTMLElement.prototype,
      "offsetWidth",
      originalOffsetWidth,
    );
  }
});

afterEach(() => {
  vi.useRealTimers();
  editorApiMocks.importDatabaseItemFromUrl.mockReset();
  editorApiMocks.uploadCatalogItemIconDataUrl.mockReset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

type ViewProps = Parameters<typeof View>[0];

function renderView(overrides: Partial<ViewProps> = {}) {
  const props = {
    classOptions,
    filteredItems: [],
    filters: DEFAULT_FILTERS,
    isLoading: false,
    itemTypeOptions,
    itemQualityOptions,
    onFilterChange: vi.fn(),
    onRetry: vi.fn(),
    onSelectItem: vi.fn(),
    onSortModeChange: vi.fn(),
    sortMode: DEFAULT_SORT_MODE,
    totalCount: 0,
    ...overrides,
  };
  const renderResult = render(<View {...props} />);

  return {
    ...renderResult,
    props,
  };
}

function createExplorerItem(item: Partial<ItemRef> = {}): ExplorerItem {
  const mergedItem: ItemRef = {
    icon: 1,
    id: 100,
    itemType: 1,
    itemQuality: ItemQuality.MAGIC,
    name: "Azure Blade",
    ...item,
  };

  return {
    idText: String(mergedItem.id),
    item: mergedItem,
    itemTypeName: "Sword",
    searchText: mergedItem.name,
    source: "static",
  };
}

function createClientRect(top: number): DOMRect {
  return {
    bottom: top,
    height: 0,
    left: 0,
    right: 0,
    toJSON: () => ({}),
    top,
    width: 0,
    x: 0,
    y: top,
  } as DOMRect;
}

function jsonResponse(value: unknown) {
  return {
    json: vi.fn().mockResolvedValue(value),
    ok: true,
  };
}

describe("database surface", () => {
  test("shows a loading skeleton", () => {
    renderView({
      isLoading: true,
    });

    const status = screen.getByRole("status", { name: "Loading database" });

    expect(status)
      .toHaveAttribute("aria-busy", "true");
    expect(status.firstElementChild)
      .toHaveClass(itemListSkeletonStyles.Skeleton);
    expect(status.firstElementChild)
      .toHaveAttribute("aria-hidden", "true");
    expect(status.querySelectorAll(
      `.${itemListSkeletonStyles.SkeletonFilterControl}`,
    )).toHaveLength(3);
    expect(status.querySelectorAll(
      `.${itemListSkeletonStyles.SkeletonRowName}`,
    )).toHaveLength(10);
    expect(document.querySelector(
      `.${itemViewSkeletonStyles.SkeletonBackButton}`,
    )).toBeInTheDocument();
    expect(document.querySelector(
      `.${itemViewSkeletonStyles.SkeletonSummaryRow}`,
    )).toBeInTheDocument();
    expect(document.querySelector(
      `.${itemViewSkeletonStyles.SkeletonClassCard}`,
    )).toBeInTheDocument();
    expect(document.querySelectorAll(
      `.${itemViewSkeletonStyles.SkeletonClassChip}`,
    )).toHaveLength(5);
    expect(document.querySelectorAll(
      `.${itemViewSkeletonStyles.SkeletonField}`,
    )).toHaveLength(13);
    expect(screen.queryByText("Loading database")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Database Explorer" }))
      .not.toBeInTheDocument();
  });

  test("renders compact filters in the item sidebar", () => {
    const { container } = renderView();

    const title = screen.getByRole("heading", { name: "Database Explorer" });
    const filters = screen.getByRole("region", { name: "Database filters" });
    const emptyList = screen.getByText("No items found.");

    expect(title).toHaveClass(itemListStyles.ViewListTitle);
    expect(
      title.compareDocumentPosition(filters) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      filters.compareDocumentPosition(emptyList) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const itemTypeFilter = screen.getByRole("button", {
      name: "Item Type: Show all",
    });
    const itemQualityFilter = screen.getByRole("button", {
      name: "Item Quality: Show all",
    });
    const classFilter = screen.getByRole("button", {
      name: "Class: Show all",
    });

    expect(itemTypeFilter).toHaveClass(itemListStyles.ViewFilterControl);
    expect(itemQualityFilter).toHaveClass(itemListStyles.ViewFilterControl);
    expect(classFilter).toHaveClass(itemListStyles.ViewFilterControl);
    expect(
      itemTypeFilter.compareDocumentPosition(itemQualityFilter) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      itemQualityFilter.compareDocumentPosition(classFilter) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.querySelector("select")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Source")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Flag")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Search")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reset filters" }))
      .not.toBeInTheDocument();
  });

  test("shows active filter labels in the compact controls", () => {
    renderView({
      filters: {
        ...DEFAULT_FILTERS,
        characterClass: "2",
        itemTypeId: "1",
        itemQuality: String(ItemQuality.MAGIC),
      },
    });

    expect(screen.getByRole("button", { name: "Item Type: Sword" }))
      .toHaveClass(itemListStyles.ViewFilterControlActive);
    expect(screen.getByRole("button", { name: "Item Quality: Magic" }))
      .toHaveClass(itemListStyles.ViewFilterControlActive);
    expect(screen.getByRole("button", { name: "Class: Sorcerer" }))
      .toHaveClass(itemListStyles.ViewFilterControlActive);
  });

  test("opens filter options and applies a selected value", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();

    renderView({
      onFilterChange,
    });

    await user.click(screen.getByRole("button", {
      name: "Item Type: Show all",
    }));

    expect(screen.queryByText("No items found.")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Item Type filter options" }))
      .toHaveClass(itemListStyles.ViewFilterOptions);
    expect(screen.getByText("Choose Item Type to Show")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show all" }))
      .toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Sword" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sword" }));

    expect(onFilterChange).toHaveBeenCalledWith({ itemTypeId: "1" });
    expect(screen.queryByRole("button", { name: "Sword" }))
      .not.toBeInTheDocument();
    expect(screen.getByText("No items found.")).toBeInTheDocument();
  });

  test("positions filter options at the top and restores list scroll on close", async () => {
    const user = userEvent.setup();

    render(
      <div data-testid="scroll-parent">
        <View
          classOptions={classOptions}
          filteredItems={[]}
          filters={DEFAULT_FILTERS}
          isLoading={false}
          itemTypeOptions={itemTypeOptions}
          itemQualityOptions={itemQualityOptions}
          onFilterChange={vi.fn()}
          onRetry={vi.fn()}
          onSelectItem={vi.fn()}
          onSortModeChange={vi.fn()}
          sortMode={DEFAULT_SORT_MODE}
          totalCount={0}
        />
      </div>,
    );

    const scrollParent = screen.getByTestId("scroll-parent");
    const getComputedStyle = window.getComputedStyle.bind(window);

    vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
      const computedStyle = getComputedStyle(element);

      return new Proxy(computedStyle, {
        get(target, property, receiver) {
          if (property === "overflowY") {
            return element instanceof HTMLElement &&
              element.dataset.testid === "scroll-parent"
              ? "auto"
              : "visible";
          }

          const value = Reflect.get(target, property, receiver);

          return typeof value === "function" ? value.bind(target) : value;
        },
      });
    });

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function getBoundingClientRect(
        this: HTMLElement,
      ) {
        return this.classList.contains(layoutStyles.Layout)
          ? createClientRect(-scrollParent.scrollTop)
          : createClientRect(0);
      });

    scrollParent.scrollTop = 280;

    await user.click(screen.getByRole("button", {
      name: "Item Type: Show all",
    }));

    await waitFor(() => expect(scrollParent.scrollTop).toBe(0));

    scrollParent.scrollTop = 160;

    await user.click(screen.getByRole("button", {
      name: "Class: Show all",
    }));

    await waitFor(() => expect(scrollParent.scrollTop).toBe(0));

    scrollParent.scrollTop = 120;

    await user.click(screen.getByRole("button", {
      name: "Class: Show all",
    }));

    await waitFor(() => expect(scrollParent.scrollTop).toBe(280));
  });

  test("switches the mobile pane from results to item detail", async () => {
    const user = userEvent.setup();
    const onSelectItem = vi.fn();
    const selectedItem = createExplorerItem();

    renderView({
      filteredItems: [selectedItem],
      onSelectItem,
      selectedItem,
      totalCount: 1,
    });

    const resultsPane = document.querySelector(
      `.${routeStyles.ViewResultsPane}`,
    );
    const itemPane = document.querySelector(`.${routeStyles.ViewItemPane}`);
    const list = screen.getByLabelText("Database item results");

    expect(resultsPane).not.toBeNull();
    expect(itemPane).not.toBeNull();
    expect(resultsPane).not.toHaveClass(
      routeStyles.ViewResultsPaneMobileHidden,
    );
    expect(itemPane).toHaveClass(routeStyles.ViewItemPaneMobileHidden);

    await user.click(await within(list).findByRole("button", {
      name: /Azure Blade/,
    }));

    expect(onSelectItem).toHaveBeenCalledWith(selectedItem);
    expect(resultsPane).toHaveClass(
      routeStyles.ViewResultsPaneMobileHidden,
    );
    expect(itemPane).not.toHaveClass(routeStyles.ViewItemPaneMobileHidden);

    const backButton = screen.getByRole("button", {
      name: "Back to item list",
    });

    expect(backButton).toHaveClass(itemViewStyles.ViewMobileBackButton);
    expect(backButton).toHaveTextContent("Item List");

    await user.click(backButton);

    expect(resultsPane).not.toHaveClass(
      routeStyles.ViewResultsPaneMobileHidden,
    );
    expect(itemPane).toHaveClass(routeStyles.ViewItemPaneMobileHidden);
  });

  test("positions detail at the top and restores list scroll on back", async () => {
    const user = userEvent.setup();
    const onSelectItem = vi.fn();
    const selectedItem = createExplorerItem();

    render(
      <div data-testid="scroll-parent">
        <View
          classOptions={emptyOptions}
          filteredItems={[selectedItem]}
          filters={DEFAULT_FILTERS}
          isLoading={false}
          itemTypeOptions={emptyOptions}
          itemQualityOptions={emptyOptions}
          onFilterChange={vi.fn()}
          onRetry={vi.fn()}
          onSelectItem={onSelectItem}
          onSortModeChange={vi.fn()}
          selectedItem={selectedItem}
          sortMode={DEFAULT_SORT_MODE}
          totalCount={1}
        />
      </div>,
    );

    const scrollParent = screen.getByTestId("scroll-parent");
    const list = screen.getByLabelText("Database item results");
    const listItem = await within(list).findByRole("button", {
      name: /Azure Blade/,
    });

    const getComputedStyle = window.getComputedStyle.bind(window);

    vi.spyOn(window, "getComputedStyle").mockImplementation((element) => {
      const computedStyle = getComputedStyle(element);

      return new Proxy(computedStyle, {
        get(target, property, receiver) {
          if (property === "overflowY") {
            return element instanceof HTMLElement &&
              element.dataset.testid === "scroll-parent"
              ? "auto"
              : "visible";
          }

          const value = Reflect.get(target, property, receiver);

          return typeof value === "function" ? value.bind(target) : value;
        },
      });
    });

    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function getBoundingClientRect(
        this: HTMLElement,
      ) {
        return this.classList.contains(layoutStyles.Layout)
          ? createClientRect(-scrollParent.scrollTop)
          : createClientRect(0);
      });

    scrollParent.scrollTop = 320;

    await user.click(listItem);

    expect(onSelectItem).toHaveBeenCalledWith(selectedItem);
    await waitFor(() => expect(scrollParent.scrollTop).toBe(0));

    await user.click(screen.getByRole("button", {
      name: "Back to item list",
    }));

    await waitFor(() => expect(scrollParent.scrollTop).toBe(320));
  });

  test("can open the mobile item detail pane initially", () => {
    const selectedItem = createExplorerItem();

    renderView({
      filteredItems: [selectedItem],
      selectedItem,
      showSelectedItemInitially: true,
      totalCount: 1,
    });

    expect(document.querySelector(`.${routeStyles.ViewResultsPane}`))
      .toHaveClass(routeStyles.ViewResultsPaneMobileHidden);
    expect(document.querySelector(`.${routeStyles.ViewItemPane}`))
      .not.toHaveClass(routeStyles.ViewItemPaneMobileHidden);
  });

  test("renders database editor surfaces in edit mode", async () => {
    const user = userEvent.setup();
    const selectedItem = createExplorerItem();

    renderView({
      canEditCatalog: true,
      existingItemIds: [100],
      filteredItems: [selectedItem],
      isEditMode: true,
      itemTypes: [
        {
          id: 1,
          name: "Sword",
        },
      ],
      selectedItem,
      totalCount: 1,
    });

    const sortButton = screen.getByRole("button", { name: "Sort" });
    const addButton = screen.getByRole("button", { name: "Add +" });

    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveClass(buttonStyles.Btn);
    expect(addButton).toHaveClass(buttonStyles.BtnGreen);
    expect(addButton).toHaveClass(itemListStyles.ViewListAddButton);
    expect(sortButton).toHaveAttribute("aria-pressed", "false");
    expect(sortButton).not.toHaveClass(
      itemListStyles.ViewListSortButtonActive,
    );
    expect(
      sortButton.compareDocumentPosition(addButton) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText("Database Item Override")).toBeInTheDocument();

    const override = screen
      .getByText("Database Item Override")
      .closest("form");

    expect(override).not.toBeNull();
    const overrideScreen = within(override as HTMLElement);
    const overrideName = overrideScreen.getByLabelText("Name");
    const overrideSeries = overrideScreen.getByLabelText("Series");
    const overrideTransmogName = overrideScreen.getByLabelText(
      "Transmog Name",
    );
    const overrideTextStack = overrideName.closest(
      `.${editorStyles.ViewFieldStack}`,
    );
    const overrideUploadAction = overrideScreen
      .getByText("Upload icon")
      .closest(`.${editorStyles.ViewIconActions}`);
    const overrideUploadLabel = overrideScreen
      .getByText("Upload icon")
      .closest("label");
    const overrideIconImportUrl = overrideScreen.getByLabelText("Import URL");
    const overrideIconImportButton = overrideScreen.getByRole("button", {
      name: "Import icon",
    });
    const overrideClearButton = overrideScreen.getByRole("button", {
      name: "Clear icon",
    });
    const overrideClearAction = overrideScreen
      .getByRole("button", { name: "Clear icon" })
      .closest(`.${editorStyles.ViewIconActions}`);

    expect(overrideName).toBeInTheDocument();
    expect(overrideTextStack).not.toBeNull();
    expect(overrideSeries.closest(`.${editorStyles.ViewFieldStack}`))
      .toBe(overrideTextStack);
    expect(overrideTransmogName.closest(`.${editorStyles.ViewFieldStack}`))
      .toBe(overrideTextStack);
    expect(overrideScreen.getByLabelText("Item Type"))
      .toBeInTheDocument();
    expect(overrideScreen.getByLabelText("Item Quality"))
      .toBeInTheDocument();
    expect(overrideIconImportUrl).toBeInTheDocument();
    expect(overrideIconImportButton).toBeDisabled();
    expect(overrideScreen.queryByLabelText("Preferred Zone"))
      .not.toBeInTheDocument();
    expect(overrideScreen.getByLabelText("Override usable classes"))
      .toBeInTheDocument();
    expect(overrideScreen.getByLabelText("Override usable classes").closest(
      `.${editorStyles.ViewClassToggle}`,
    )).not.toBeNull();
    expect(overrideScreen.getByLabelText("Barbarian")).toBeDisabled();
    expect(overrideScreen.getByLabelText("Barbarian").closest(
      `.${editorStyles.ViewClassToggle}`,
    )).not.toBeNull();
    expect(overrideUploadAction).not.toBeNull();
    expect(overrideUploadLabel).toHaveClass(drawerStyles.SecondaryButton);
    expect(overrideUploadLabel).toHaveClass(editorStyles.ViewFileAction);
    expect(overrideClearAction).toBe(overrideUploadAction);
    expect(overrideClearButton).toHaveClass(drawerStyles.DeleteButton);
    expect(overrideClearButton).toHaveClass(editorStyles.ViewIconActionButton);
    expect(overrideScreen.getByRole("button", { name: "Save override" }))
      .toHaveClass(editorStyles.ViewPrimaryButton);
    expect(overrideScreen.queryByLabelText("Override Values"))
      .not.toBeInTheDocument();
    expect(overrideScreen.queryByLabelText("Transmog"))
      .not.toBeInTheDocument();
    expect(overrideScreen.queryByLabelText("Salvageable"))
      .not.toBeInTheDocument();
    expect(overrideScreen.queryByLabelText("Vessel of Hatred"))
      .not.toBeInTheDocument();
    expect(overrideScreen.queryByLabelText("Lord of Hatred"))
      .not.toBeInTheDocument();

    await user.click(addButton);

    const creator = screen.getByRole("dialog", {
      name: "New Database item",
    });

    expect(creator).toBeInTheDocument();
    expect(creator.parentElement).toHaveClass(editorStyles.ViewOverlay);
    expect(creator.parentElement?.parentElement).toBe(document.body);
    expect(within(creator).getByLabelText("Import URL")).toBeInTheDocument();
    const creatorScreen = within(creator);
    const creatorHeader = creatorScreen
      .getByText("Database Explorer")
      .closest(`.${drawerStyles.Header}`);
    const creatorFooter = creatorScreen
      .getByRole("button", { name: "Save item" })
      .closest(`.${drawerStyles.Actions}`);
    const creatorIconSection = creatorScreen
      .getByText("No icon selected")
      .closest(`.${editorStyles.ViewIconSection}`);
    const creatorItemId = creatorScreen.getByLabelText("Item ID");
    const creatorName = creatorScreen.getByLabelText("Name");
    const creatorSeries = creatorScreen.getByLabelText("Series");
    const creatorTransmogName = creatorScreen.getByLabelText("Transmog Name");
    const creatorTextStack = creatorName.closest(
      `.${editorStyles.ViewFieldStack}`,
    );
    const creatorUploadAction = creatorScreen
      .getByText("Upload icon")
      .closest(`.${editorStyles.ViewIconActions}`);
    const creatorUploadLabel = creatorScreen
      .getByText("Upload icon")
      .closest("label");
    const creatorClearButton = creatorScreen.getByRole("button", {
      name: "Clear icon",
    });
    const creatorCloseButton = creatorScreen.getByRole("button", {
      name: "Close",
    });
    const creatorResetButton = creatorScreen.getByRole("button", {
      name: "Reset",
    });
    const creatorSaveButton = creatorScreen.getByRole("button", {
      name: "Save item",
    });
    const creatorClearAction = creatorScreen
      .getByRole("button", { name: "Clear icon" })
      .closest(`.${editorStyles.ViewIconActions}`);

    expect(creatorHeader).not.toBeNull();
    expect(creatorScreen.getByRole("heading", { name: "New Database item" }))
      .toHaveClass(drawerStyles.Title);
    expect(creatorScreen.queryByText("Database item")).not.toBeInTheDocument();
    expect(creatorScreen.getByRole("button", {
      name: "Close item creator",
    })).toHaveClass(drawerStyles.CloseButton);
    expect(creatorFooter).not.toBeNull();
    expect(creatorResetButton).toHaveClass(drawerStyles.SecondaryButton);
    expect(creatorCloseButton).toHaveClass(drawerStyles.SecondaryButton);
    expect(creatorSaveButton).toHaveClass(drawerStyles.SaveButton);
    expect(creatorCloseButton.closest(`.${drawerStyles.ActionLeft}`))
      .not.toBeNull();
    expect(creatorResetButton.closest(`.${drawerStyles.ActionRight}`))
      .not.toBeNull();
    expect(creatorSaveButton.closest(`.${drawerStyles.ActionRight}`))
      .not.toBeNull();
    expect(creatorItemId).toHaveAttribute("readonly");
    expect(creatorItemId.closest(`.${editorStyles.ViewStandaloneIdRow}`))
      .not.toBeNull();
    expect(creatorIconSection).not.toBeNull();
    expect(
      (creatorIconSection as HTMLElement).compareDocumentPosition(
        creatorItemId,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      creatorItemId.compareDocumentPosition(creatorName) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(creatorScreen.getByLabelText("Item Type")).toBeInTheDocument();
    expect(creatorScreen.getByLabelText("Item Quality")).toBeInTheDocument();
    expect(creatorScreen.queryByLabelText("Preferred Zone"))
      .not.toBeInTheDocument();
    expect(creatorScreen.getByLabelText("Barbarian")).toBeChecked();
    const creatorClassGrid = creatorScreen.getByLabelText("Barbarian").closest(
      `.${editorStyles.ViewClassGrid}`,
    );

    expect(creatorClassGrid).not.toBeNull();
    expect(creatorClassGrid).toHaveClass(editorStyles.ViewClassGridTwoColumn);
    expect(creatorScreen.getByLabelText("Barbarian").closest(
      `.${editorStyles.ViewClassToggle}`,
    )).not.toBeNull();
    expect(creatorScreen.getByLabelText("Rogue")).toBeChecked();
    expect(creatorSeries).toBeInTheDocument();
    expect(creatorTextStack).not.toBeNull();
    expect(creatorSeries.closest(`.${editorStyles.ViewFieldStack}`))
      .toBe(creatorTextStack);
    expect(creatorTransmogName.closest(`.${editorStyles.ViewFieldStack}`))
      .toBe(creatorTextStack);
    expect(creatorScreen.getByText("No icon selected")).toBeInTheDocument();
    expect(creatorUploadAction).not.toBeNull();
    expect(creatorUploadLabel).toHaveClass(drawerStyles.SecondaryButton);
    expect(creatorUploadLabel).toHaveClass(editorStyles.ViewFileAction);
    expect(creatorClearAction).toBe(creatorUploadAction);
    expect(creatorClearButton).toHaveClass(drawerStyles.DeleteButton);
    expect(creatorClearButton).toHaveClass(editorStyles.ViewIconActionButton);
    expect(creatorScreen.queryByLabelText("Icon")).not.toBeInTheDocument();
    expect(creatorScreen.queryByText("Optional Values"))
      .not.toBeInTheDocument();
    expect(creatorScreen.queryByLabelText("Transmog"))
      .not.toBeInTheDocument();
    expect(creatorScreen.queryByLabelText("Salvageable"))
      .not.toBeInTheDocument();
    expect(creatorScreen.queryByLabelText("Vessel of Hatred"))
      .not.toBeInTheDocument();
    expect(creatorScreen.queryByLabelText("Lord of Hatred"))
      .not.toBeInTheDocument();
    expect(creatorScreen.getByRole("button", {
      name: "Close item creator",
    })).toBeInTheDocument();
  });

  test("enables database editor actions only when form state changes", async () => {
    const user = userEvent.setup();
    const selectedItem = createExplorerItem();

    renderView({
      canEditCatalog: true,
      filteredItems: [selectedItem],
      isEditMode: true,
      selectedItem,
      totalCount: 1,
    });

    const overrideForm = screen
      .getByText("Database Item Override")
      .closest("form");

    expect(overrideForm).not.toBeNull();
    const overrideScreen = within(overrideForm as HTMLElement);
    const overrideImportUrl = overrideScreen.getByLabelText("Import URL");
    const overrideName = overrideScreen.getByLabelText("Name");
    const overrideReset = overrideScreen.getByRole("button", {
      name: "Reset",
    });
    const overrideSave = overrideScreen.getByRole("button", {
      name: "Save override",
    });

    expect(overrideReset).toBeDisabled();
    expect(overrideSave).toBeDisabled();

    await user.type(overrideName, "Corrected Blade");

    expect(overrideReset).toBeEnabled();
    expect(overrideSave).toBeEnabled();

    await user.click(overrideReset);

    expect(overrideName).toHaveValue("");
    expect(overrideReset).toBeDisabled();
    expect(overrideSave).toBeDisabled();

    await user.type(overrideImportUrl, "https://example.com/item");

    expect(overrideReset).toBeEnabled();
    expect(overrideSave).toBeDisabled();

    await user.click(overrideReset);

    expect(overrideImportUrl).toHaveValue("");
    expect(overrideReset).toBeDisabled();
    expect(overrideSave).toBeDisabled();

    await user.click(overrideScreen.getByLabelText("Override usable classes"));

    expect(overrideReset).toBeEnabled();
    expect(overrideSave).toBeEnabled();

    await user.click(overrideReset);

    expect(overrideScreen.getByLabelText("Override usable classes"))
      .not.toBeChecked();
    expect(overrideReset).toBeDisabled();
    expect(overrideSave).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Add +" }));

    const creator = screen.getByRole("dialog", {
      name: "New Database item",
    });
    const creatorScreen = within(creator);
    const creatorName = creatorScreen.getByLabelText("Name");
    const creatorReset = creatorScreen.getByRole("button", {
      name: "Reset",
    });
    const creatorSave = creatorScreen.getByRole("button", {
      name: "Save item",
    });

    expect(creatorReset).toBeDisabled();
    expect(creatorSave).toBeDisabled();

    await user.click(creatorScreen.getByLabelText("Barbarian"));

    expect(creatorScreen.getByLabelText("Barbarian")).not.toBeChecked();
    expect(creatorReset).toBeEnabled();
    expect(creatorSave).toBeDisabled();

    await user.type(creatorName, "Missing Blade");

    expect(creatorSave).toBeEnabled();

    await user.click(creatorReset);

    expect(creatorName).toHaveValue("");
    expect(creatorScreen.getByLabelText("Barbarian")).toBeChecked();
    expect(creatorReset).toBeDisabled();
    expect(creatorSave).toBeDisabled();
  });

  test("deletes an existing database item record after confirmation", async () => {
    vi.useFakeTimers();
    const deleteCatalogItem = vi
      .spyOn(catalogStore, "deleteCatalogItem")
      .mockResolvedValue(undefined);
    const onRefreshItems = vi.fn();
    const selectedItem: ExplorerItem = {
      ...createExplorerItem(),
      catalogItem: {
        itemId: 100,
        name: "Azure Blade",
      },
    };

    renderView({
      canEditCatalog: true,
      filteredItems: [selectedItem],
      isEditMode: true,
      onRefreshItems,
      selectedItem,
      totalCount: 1,
    });

    const overrideForm = screen
      .getByText("Database Item Override")
      .closest("form");

    expect(overrideForm).not.toBeNull();

    fireEvent.click(
      within(overrideForm as HTMLElement).getByRole("button", {
        name: "Delete",
      }),
    );

    const confirmation = screen.getByRole("dialog", {
      name: "Delete database item",
    });

    expect(confirmation).toBeInTheDocument();
    expect(within(confirmation).getByText("Azure Blade")).toBeInTheDocument();
    expect(within(confirmation).getByRole("button", {
      name: "Delete 3",
    })).toBeDisabled();

    for (let tick = 0; tick < 3; tick += 1) {
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });
    }

    await act(async () => {
      fireEvent.click(within(confirmation).getByRole("button", {
        name: "Delete",
      }));
      await Promise.resolve();
    });

    expect(deleteCatalogItem).toHaveBeenCalledWith(100);
    expect(onRefreshItems).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog", {
      name: "Delete database item",
    })).not.toBeInTheDocument();
  });

  test("imports only the icon for an item override URL", async () => {
    const user = userEvent.setup();
    const importUrl = "https://www.wowhead.com/diablo-4/item/anlace-784786";
    const iconDataUrl = "data:image/webp;base64,aWNvbg==";
    editorApiMocks.importDatabaseItemFromUrl.mockResolvedValue({
      icon: {
        contentType: "image/webp",
        dataUrl: iconDataUrl,
      },
      item: {
        id: 784786,
        name: "Anlace",
      },
      itemTypeName: "Dagger",
    });
    editorApiMocks.uploadCatalogItemIconDataUrl.mockResolvedValue({
      iconId: 4001,
      path: "icons/4001.webp",
    });
    const selectedItem = createExplorerItem();

    renderView({
      canEditCatalog: true,
      filteredItems: [selectedItem],
      isEditMode: true,
      selectedItem,
      totalCount: 1,
    });

    const overrideForm = screen
      .getByText("Database Item Override")
      .closest("form");

    expect(overrideForm).not.toBeNull();
    const overrideScreen = within(overrideForm as HTMLElement);

    await user.type(overrideScreen.getByLabelText("Import URL"), importUrl);
    await user.click(overrideScreen.getByRole("button", {
      name: "Import icon",
    }));

    await waitFor(() =>
      expect(editorApiMocks.importDatabaseItemFromUrl)
        .toHaveBeenCalledWith(importUrl),
    );
    await waitFor(() =>
      expect(editorApiMocks.uploadCatalogItemIconDataUrl)
        .toHaveBeenCalledWith(iconDataUrl),
    );
    expect(overrideScreen.getByRole("img", {
      name: "Item icon override",
    })).toHaveAttribute("src", iconDataUrl);
    expect(overrideScreen.getByRole("button", { name: "Save override" }))
      .toBeEnabled();
    expect(overrideScreen.getByLabelText("Name")).toHaveValue("");
    expect(overrideScreen.getByLabelText("Item Type")).toHaveValue("");
  });

  test("uses item quality colour for list item names", () => {
    const { container } = render(
      <View
        classOptions={emptyOptions}
        filteredItems={[createExplorerItem()]}
        filters={DEFAULT_FILTERS}
        isLoading={false}
        itemTypeOptions={emptyOptions}
        itemQualityOptions={emptyOptions}
        onFilterChange={vi.fn()}
        onRetry={vi.fn()}
        onSelectItem={vi.fn()}
        onSortModeChange={vi.fn()}
        sortMode={DEFAULT_SORT_MODE}
        totalCount={1}
      />,
    );

    expect(screen.getByText("Azure Blade")).toHaveClass(
      itemListStyles.ViewItemQualityMagic,
    );
    expect(container.querySelector(`.${itemListStyles.ViewListItemIcon}`))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Game data")).not.toBeInTheDocument();
  });

  test("renders inventory images with the compact property layout", () => {
    const selectedItem = createExplorerItem({
      description: "A blade wrapped in cold light.",
      filename: "base/meta/Item/Azure_Blade",
      invImages: [[2100, 2101], [2200, 0]],
      isTransmog: true,
      salvageable: true,
      series: '"Frozen Steel"',
      similarItems: [101],
      transmogName: "Azure Edge",
    });

    renderView({
      filteredItems: [selectedItem],
      selectedItem,
      totalCount: 1,
    });

    const inventorySection = screen
      .getByRole("heading", { name: "Inventory Images" })
      .closest("section");

    expect(inventorySection).not.toBeNull();

    const detailHeader = document.querySelector(
      `.${itemViewStyles.ViewDetailHeader}`,
    );

    expect(detailHeader).not.toBeNull();

    const inventory = within(inventorySection as HTMLElement);
    const detail = within(detailHeader as HTMLElement);
    const detailIcon = (detailHeader as HTMLElement).querySelector(
      `.${itemViewStyles.ViewDetailIcon}`,
    );
    const detailNameLabel = detail
      .getAllByText("Name")
      .find((element) =>
        element.classList.contains(itemViewStyles.ViewFieldLabel));
    const detailTransmogNameLabel = detail
      .getAllByText("Transmog Name")
      .find((element) =>
        element.classList.contains(itemViewStyles.ViewFieldLabel));
    const detailSeriesLabel = detail
      .getAllByText("Series")
      .find((element) =>
        element.classList.contains(itemViewStyles.ViewFieldLabel));
    const descriptionLabel = detail
      .getAllByText("Description")
      .find((element) =>
        element.classList.contains(itemViewStyles.ViewFieldLabel));
    const detailItemIdLabel = detail
      .getAllByText("Item ID")
      .find((element) =>
        element.classList.contains(itemViewStyles.ViewFieldLabel));
    const detailItemTypeLabel = screen
      .getAllByText("Item Type")
      .find((element) =>
        element.classList.contains(itemViewStyles.ViewFieldLabel));
    const detailItemQualityLabel = screen
      .getAllByText("Item Quality")
      .find((element) =>
        element.classList.contains(itemViewStyles.ViewFieldLabel));
    const detailPreferredZoneLabel = screen
      .getAllByText("Preferred Zone")
      .find((element) =>
        element.classList.contains(itemViewStyles.ViewFieldLabel));
    const usableByClassesHeading = screen.getByRole("heading", {
      name: "Usable by Classes",
    });
    const detailHeaderCard = (detailHeader as HTMLElement).closest(
      `.${itemViewStyles.ViewDetailCard}`,
    );
    const usableByClassesCard = usableByClassesHeading.closest(
      `.${itemViewStyles.ViewDetailCard}`,
    );
    const summaryRow = detailHeaderCard?.parentElement;
    const usableClassBadge = screen.getByText("Sorcerer").closest(
      `.${itemViewStyles.ViewClassChip}`,
    );

    const inventoryMaleImage = inventory.getByRole("img", {
      name: "Sorcerer (Male)",
    });
    const inventoryMaleLabel = inventory.getByText("Sorcerer (Male)");
    const inventoryFemaleLabel = inventory.getByText("Sorcerer (Female)");

    expect(inventoryMaleImage).toHaveClass(
      itemViewStyles.ViewInventoryAsset,
    );
    expect(inventoryMaleLabel.closest("figure")).toHaveClass(
      itemViewStyles.ViewInventoryImage,
    );
    expect(inventoryFemaleLabel.closest("figure")).toHaveClass(
      itemViewStyles.ViewInventoryImage,
    );
    expect(
      inventoryMaleLabel.compareDocumentPosition(inventoryFemaleLabel) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(inventory.queryByText("2100")).not.toBeInTheDocument();
    expect(inventory.queryByText("2101")).not.toBeInTheDocument();
    expect(inventory.queryByText("Druid (Female)"))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Properties" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Similar Items" }))
      .not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Available Classes" }))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Icon")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Description" }))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Transmog")).not.toBeInTheDocument();
    expect(screen.queryByText("Salvageable")).not.toBeInTheDocument();
    expect(detail.getByText("Azure Blade")).toBeInTheDocument();
    expect(detail.getByText("A blade wrapped in cold light."))
      .toBeInTheDocument();
    expect(detail.getByText("Azure Edge")).toBeInTheDocument();
    expect(detail.getByText("Frozen Steel")).toBeInTheDocument();
    expect(detail.getByText("100")).toBeInTheDocument();
    expect(detail.getByText("Sword (1)")).toBeInTheDocument();
    expect(detailIcon).not.toBeNull();
    expect(detailHeaderCard).not.toBeNull();
    expect(usableByClassesCard).not.toBeNull();
    expect(usableByClassesCard).not.toBe(detailHeaderCard);
    expect(summaryRow).toHaveClass(itemViewStyles.ViewSummaryRow);
    expect(usableByClassesCard?.parentElement).toBe(summaryRow);
    expect(usableByClassesCard).toHaveClass(itemViewStyles.ViewClassCard);
    expect(usableClassBadge).not.toBeNull();
    expect(detailNameLabel).not.toBeUndefined();
    expect(detailTransmogNameLabel).not.toBeUndefined();
    expect(detailSeriesLabel).not.toBeUndefined();
    expect(descriptionLabel).not.toBeUndefined();
    expect(detailItemIdLabel).not.toBeUndefined();
    expect(detailItemTypeLabel).not.toBeUndefined();
    expect(detailItemQualityLabel).not.toBeUndefined();
    expect(detailPreferredZoneLabel).not.toBeUndefined();
    expect(
      (detailIcon as HTMLElement).compareDocumentPosition(
        detailNameLabel as HTMLElement,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      (detailNameLabel as HTMLElement).compareDocumentPosition(
        detailItemIdLabel as HTMLElement,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      (detailItemIdLabel as HTMLElement).compareDocumentPosition(
        detailItemTypeLabel as HTMLElement,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      (detailItemTypeLabel as HTMLElement).compareDocumentPosition(
        detailSeriesLabel as HTMLElement,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      (detailSeriesLabel as HTMLElement).compareDocumentPosition(
        descriptionLabel as HTMLElement,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      (descriptionLabel as HTMLElement).compareDocumentPosition(
        detailTransmogNameLabel as HTMLElement,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      (detailTransmogNameLabel as HTMLElement).compareDocumentPosition(
        detailItemQualityLabel as HTMLElement,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      (detailItemQualityLabel as HTMLElement).compareDocumentPosition(
        detailPreferredZoneLabel as HTMLElement,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      (detailPreferredZoneLabel as HTMLElement).compareDocumentPosition(
        usableByClassesHeading,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const dataminedFileHeading = screen.getByRole("heading", {
      name: "Datamined Files",
    });

    expect(
      (inventorySection as HTMLElement).compareDocumentPosition(
        dataminedFileHeading,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText("base/meta/Item/Azure_Blade"))
      .toHaveClass(itemViewStyles.ViewDataminedFileName);
    expect(screen.getByText("enUS_Text/meta/StringList/Item_Azure_Blade.stl"))
      .toHaveClass(itemViewStyles.ViewDataminedFileName);
    expect(screen.getByText(
      "enUS_Text/meta/StringList/StoreProduct_Azure_Blade.stl",
    )).toHaveClass(itemViewStyles.ViewDataminedFileName);
    expect(screen.queryByRole("link", {
      name: "base/meta/Item/Azure_Blade",
    })).not.toBeInTheDocument();
  });

  test("hides inventory images when there is only one icon variant", () => {
    const selectedItem = createExplorerItem({
      invImages: [[2100, 0]],
    });

    renderView({
      filteredItems: [selectedItem],
      selectedItem,
      totalCount: 1,
    });

    expect(screen.queryByRole("heading", { name: "Inventory Images" }))
      .not.toBeInTheDocument();
  });

  test("renders collection log references for the selected item", () => {
    const selectedItem = createExplorerItem();

    renderView({
      collectionReferences: [
        {
          category: "Monster Drop",
          claim: "World Boss Drop",
          claimDescription: "Dropped by Ashava.",
          collectionId: "world-boss",
          collectionName: "Monster / World Boss",
        },
        {
          category: "Tejal's Shop",
          claim: "Cash Shop",
          claimDescription: "Purchased from the cash shop.",
          collectionId: "shop",
          collectionName: "Shop / Barbarian Armor",
        },
      ],
      filteredItems: [selectedItem],
      selectedItem,
      totalCount: 1,
    });

    const collectionLogSection = screen
      .getByRole("heading", { name: "Tracker Data" })
      .closest("section");

    expect(collectionLogSection).not.toBeNull();

    const collectionLog = within(collectionLogSection as HTMLElement);
    const worldBossReference = collectionLog
      .getByText("Monster / World Boss")
      .closest(`.${itemViewStyles.ViewCollectionReference}`);
    const shopReference = collectionLog
      .getByText("Shop / Barbarian Armor")
      .closest(`.${itemViewStyles.ViewCollectionReference}`);

    expect(worldBossReference).not.toBeNull();
    expect(shopReference).not.toBeNull();
    expect(collectionLog.getByText("Monster Drop")).toHaveClass(
      itemViewStyles.ViewCollectionReferenceCategory,
    );
    expect(collectionLog.getByText("Monster / World Boss")).toHaveClass(
      itemViewStyles.ViewCollectionReferenceCollection,
    );
    expect(within(worldBossReference as HTMLElement).getByText("Claim"))
      .toHaveClass(itemViewStyles.ViewFieldLabel);
    expect(within(worldBossReference as HTMLElement).getByText(
      "World Boss Drop",
    )).toHaveClass(itemViewStyles.ViewFieldValue);
    expect(within(worldBossReference as HTMLElement).getByText(
      "Dropped by Ashava.",
    )).toHaveClass(itemViewStyles.ViewFieldValue);
    expect(within(shopReference as HTMLElement).getByText("Cash Shop"))
      .toBeInTheDocument();
    expect(within(shopReference as HTMLElement).getByText(
      "Purchased from the cash shop.",
    )).toBeInTheDocument();
  });

  test("fetches and renders datamined file json", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        item: {
          id: 100,
          name: "Azure Blade",
          unsafe: "<script>alert(1)</script>",
        },
      }),
    );
    const selectedItem = createExplorerItem({
      filename: "base/meta/Item/Azure_Blade",
    });
    vi.stubGlobal("fetch", fetchMock);

    renderView({
      filteredItems: [selectedItem],
      selectedItem,
      totalCount: 1,
    });

    const showJsonButton = screen.getByRole("button", {
      name: "Show Base file JSON",
    });

    expect(showJsonButton).toHaveTextContent("▸");

    await user.click(showJsonButton);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("base/meta/Item/Azure_Blade.json"),
      {
        signal: expect.any(AbortSignal),
      },
    );

    const jsonPreview = await screen.findByLabelText("Base file JSON");

    expect(jsonPreview).toHaveClass(itemViewStyles.ViewJsonPreview);
    expect(jsonPreview.textContent).toContain('"name": "Azure Blade"');
    expect(jsonPreview.textContent).toContain(
      '"unsafe": "<script>alert(1)</script>"',
    );
    expect(jsonPreview.querySelector("script")).toBeNull();
    expect(screen.getByRole("button", { name: "Hide Base file JSON" }))
      .toHaveTextContent("▾");
  });

  test("fetches inferred string files independently", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({ text: "Item sword text" }))
      .mockResolvedValueOnce(jsonResponse({ text: "Store sword text" }));
    const selectedItem = createExplorerItem({
      filename: "base/meta/Item/sword_stor139.itm",
    });
    vi.stubGlobal("fetch", fetchMock);

    renderView({
      filteredItems: [selectedItem],
      selectedItem,
      totalCount: 1,
    });

    expect(screen.getByText("base/meta/Item/sword_stor139.itm"))
      .toHaveClass(itemViewStyles.ViewDataminedFileName);
    expect(screen.getByText(
      "enUS_Text/meta/StringList/Item_sword_stor139.stl",
    )).toHaveClass(itemViewStyles.ViewDataminedFileName);
    expect(screen.getByText(
      "enUS_Text/meta/StringList/StoreProduct_sword_stor139.stl",
    )).toHaveClass(itemViewStyles.ViewDataminedFileName);

    await user.click(screen.getByRole("button", {
      name: "Show String file JSON",
    }));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "enUS_Text/meta/StringList/Item_sword_stor139.stl.json",
      ),
      {
        signal: expect.any(AbortSignal),
      },
    );
    expect(await screen.findByLabelText("String file JSON"))
      .toHaveTextContent('"Item sword text"');
    expect(screen.queryByLabelText("Base file JSON"))
      .not.toBeInTheDocument();

    await user.click(screen.getByRole("button", {
      name: "Show Store string file JSON",
    }));

    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining(
        "enUS_Text/meta/StringList/StoreProduct_sword_stor139.stl.json",
      ),
      {
        signal: expect.any(AbortSignal),
      },
    );
    expect(await screen.findByLabelText("Store string file JSON"))
      .toHaveTextContent('"Store sword text"');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test("embeds sno references into the preview that loaded them", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        jsonResponse({
          text: "Item sword text",
          snoActor: {
            __targetFileName__: "base/meta/Actor/String_Actor.acr",
            id: 901,
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ base: "Base sword item" }))
      .mockResolvedValueOnce(jsonResponse({ displayName: "String Actor" }));
    const selectedItem = createExplorerItem({
      filename: "base/meta/Item/sword_stor139.itm",
    });
    vi.stubGlobal("fetch", fetchMock);

    renderView({
      filteredItems: [selectedItem],
      selectedItem,
      totalCount: 1,
    });

    await user.click(screen.getByRole("button", {
      name: "Show String file JSON",
    }));
    await user.click(screen.getByRole("button", {
      name: "Show Base file JSON",
    }));

    const stringPreview = await screen.findByLabelText("String file JSON");
    const basePreview = await screen.findByLabelText("Base file JSON");

    await user.click(await screen.findByRole("button", {
      name: "Load snoActor reference base/meta/Actor/String_Actor.acr",
    }));

    expect(fetchMock).toHaveBeenLastCalledWith(
      expect.stringContaining("base/meta/Actor/String_Actor.acr.json"),
      {
        signal: expect.any(AbortSignal),
      },
    );
    await waitFor(() =>
      expect(stringPreview.textContent).toContain(
        '"displayName": "String Actor"',
      )
    );
    expect(basePreview.textContent).toContain('"base": "Base sword item"');
    expect(basePreview.textContent).not.toContain("String Actor");
  });

  test("shows missing optional datamined file errors per file", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });
    const selectedItem = createExplorerItem({
      filename: "base/meta/Item/sword_stor139.itm",
    });
    vi.stubGlobal("fetch", fetchMock);

    renderView({
      filteredItems: [selectedItem],
      selectedItem,
      totalCount: 1,
    });

    await user.click(screen.getByRole("button", {
      name: "Show Store string file JSON",
    }));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "enUS_Text/meta/StringList/StoreProduct_sword_stor139.stl.json",
      ),
      {
        signal: expect.any(AbortSignal),
      },
    );
    expect(await screen.findByRole("alert"))
      .toHaveTextContent("Failed to load JSON (404).");
    expect(screen.getByRole("button", {
      name: "Retry Store string file JSON",
    })).toBeInTheDocument();
    expect(screen.queryByLabelText("Base file JSON"))
      .not.toBeInTheDocument();
    expect(screen.queryByLabelText("String file JSON"))
      .not.toBeInTheDocument();
  });

  test("rejects unsafe datamined file paths before fetching json", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    const selectedItem = createExplorerItem({
      filename: "../Secrets",
    });
    vi.stubGlobal("fetch", fetchMock);

    renderView({
      filteredItems: [selectedItem],
      selectedItem,
      totalCount: 1,
    });

    await user.click(screen.getByRole("button", {
      name: "Show Base file JSON",
    }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert"))
      .toHaveTextContent("Invalid datamined file reference.");
  });

  test("embeds datamined sno references in place", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        jsonResponse({
          item: {
            id: 100,
            snoActor: {
              __targetFileName__: "base/meta/Actor/Azure_Actor.acr",
              id: 901,
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          displayName: "Azure Actor",
          snoPower: {
            __targetFileName__: "base/meta/Power/Azure_Power.pow",
            id: 902,
          },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          displayName: "Azure Power",
        }),
      );
    const selectedItem = createExplorerItem({
      filename: "base/meta/Item/Azure_Blade",
    });
    vi.stubGlobal("fetch", fetchMock);

    renderView({
      filteredItems: [selectedItem],
      selectedItem,
      totalCount: 1,
    });

    await user.click(screen.getByRole("button", {
      name: "Show Base file JSON",
    }));
    await user.click(await screen.findByRole("button", {
      name: "Load snoActor reference base/meta/Actor/Azure_Actor.acr",
    }));

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("base/meta/Actor/Azure_Actor.acr.json"),
      {
        signal: expect.any(AbortSignal),
      },
    );

    const jsonPreview = await screen.findByLabelText("Base file JSON");

    await waitFor(() =>
      expect(jsonPreview.textContent).toContain(
        '"displayName": "Azure Actor"',
      )
    );
    expect(jsonPreview.textContent).not.toContain(
      "base/meta/Actor/Azure_Actor.acr",
    );

    await user.click(await screen.findByRole("button", {
      name: "Load snoPower reference base/meta/Power/Azure_Power.pow",
    }));

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("base/meta/Power/Azure_Power.pow.json"),
      {
        signal: expect.any(AbortSignal),
      },
    );
    await waitFor(() =>
      expect(jsonPreview.textContent).toContain(
        '"displayName": "Azure Power"',
      )
    );
  });

  test("rejects unsafe datamined sno reference paths before fetching json", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        item: {
          id: 100,
          snoActor: {
            __targetFileName__: "../Secrets",
            id: 901,
          },
        },
      }),
    );
    const selectedItem = createExplorerItem({
      filename: "base/meta/Item/Azure_Blade",
    });
    vi.stubGlobal("fetch", fetchMock);

    renderView({
      filteredItems: [selectedItem],
      selectedItem,
      totalCount: 1,
    });

    await user.click(screen.getByRole("button", {
      name: "Show Base file JSON",
    }));
    await user.click(await screen.findByRole("button", {
      name: "Load snoActor reference ../Secrets",
    }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("Invalid datamined file reference."))
      .toHaveClass(itemViewStyles.ViewJsonReferenceError);
  });

  test("shows datamined file json load errors", async () => {
    const user = userEvent.setup();
    const selectedItem = createExplorerItem({
      filename: "base/meta/Item/Missing_Blade",
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }));

    renderView({
      filteredItems: [selectedItem],
      selectedItem,
      totalCount: 1,
    });

    await user.click(screen.getByRole("button", {
      name: "Show Base file JSON",
    }));

    expect(await screen.findByRole("alert"))
      .toHaveTextContent("Failed to load JSON (404).");
    expect(screen.getByRole("button", { name: "Retry Base file JSON" }))
      .toHaveTextContent("↻");
  });

  test("places result totals below the item list", () => {
    render(
      <View
        classOptions={emptyOptions}
        filteredItems={[createExplorerItem()]}
        filters={DEFAULT_FILTERS}
        isLoading={false}
        itemTypeOptions={emptyOptions}
        itemQualityOptions={emptyOptions}
        onFilterChange={vi.fn()}
        onRetry={vi.fn()}
        onSelectItem={vi.fn()}
        onSortModeChange={vi.fn()}
        sortMode={DEFAULT_SORT_MODE}
        totalCount={12}
      />,
    );

    const list = screen.getByLabelText("Database item results");
    const results = screen.getByText("1 results");
    const indexed = screen.getByText("12 indexed");
    const stats = results.closest("section");

    expect(stats).not.toBeNull();
    expect(
      list.compareDocumentPosition(stats as HTMLElement) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(results).toHaveClass(itemListStyles.ViewStatsResults);
    expect(indexed).toHaveClass(itemListStyles.ViewStatsIndexed);
  });

  test("virtualizes long item result lists", () => {
    const items = Array.from({ length: 200 }, (_, index) =>
      createExplorerItem({
        id: index + 100,
        name: `Item ${index + 1}`,
      }),
    );

    render(
      <View
        classOptions={emptyOptions}
        filteredItems={items}
        filters={DEFAULT_FILTERS}
        isLoading={false}
        itemTypeOptions={emptyOptions}
        itemQualityOptions={emptyOptions}
        onFilterChange={vi.fn()}
        onRetry={vi.fn()}
        onSelectItem={vi.fn()}
        onSortModeChange={vi.fn()}
        sortMode={DEFAULT_SORT_MODE}
        totalCount={items.length}
      />,
    );

    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.queryByText("Item 200")).not.toBeInTheDocument();
  });

  test("renders item list sort controls", async () => {
    const user = userEvent.setup();
    const onSortModeChange = vi.fn();
    const { rerender } = render(
      <View
        classOptions={emptyOptions}
        filteredItems={[createExplorerItem()]}
        filters={DEFAULT_FILTERS}
        isLoading={false}
        itemTypeOptions={emptyOptions}
        itemQualityOptions={emptyOptions}
        onFilterChange={vi.fn()}
        onRetry={vi.fn()}
        onSelectItem={vi.fn()}
        onSortModeChange={onSortModeChange}
        sortMode="nameAsc"
        totalCount={1}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Database Explorer" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Sort results" }))
      .toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sort" }))
      .toHaveTextContent("↑");
    expect(screen.getByRole("button", { name: "Sort" }))
      .toHaveClass(itemListStyles.ViewListSortButtonActive);

    await user.click(screen.getByRole("button", { name: "Sort" }));

    expect(onSortModeChange).toHaveBeenLastCalledWith("nameDesc");
    expect(screen.queryByRole("button", { name: "Quality" }))
      .not.toBeInTheDocument();

    rerender(
      <View
        classOptions={emptyOptions}
        filteredItems={[createExplorerItem()]}
        filters={DEFAULT_FILTERS}
        isLoading={false}
        itemTypeOptions={emptyOptions}
        itemQualityOptions={emptyOptions}
        onFilterChange={vi.fn()}
        onRetry={vi.fn()}
        onSelectItem={vi.fn()}
        onSortModeChange={onSortModeChange}
        sortMode="nameDesc"
        totalCount={1}
      />,
    );

    expect(screen.getByRole("button", { name: "Sort" }))
      .toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Sort" }))
      .toHaveTextContent("↓");

    await user.click(screen.getByRole("button", { name: "Sort" }));

    expect(onSortModeChange).toHaveBeenLastCalledWith("none");

    rerender(
      <View
        classOptions={emptyOptions}
        filteredItems={[createExplorerItem()]}
        filters={DEFAULT_FILTERS}
        isLoading={false}
        itemTypeOptions={emptyOptions}
        itemQualityOptions={emptyOptions}
        onFilterChange={vi.fn()}
        onRetry={vi.fn()}
        onSelectItem={vi.fn()}
        onSortModeChange={onSortModeChange}
        sortMode="none"
        totalCount={1}
      />,
    );

    expect(screen.getByRole("button", { name: "Sort" }))
      .toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Sort" }))
      .toHaveTextContent("↕");
    expect(screen.getByRole("button", { name: "Sort" }))
      .not.toHaveClass(itemListStyles.ViewListSortButtonActive);

    await user.click(screen.getByRole("button", { name: "Sort" }));

    expect(onSortModeChange).toHaveBeenLastCalledWith("nameAsc");
  });
});
