import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { MagicType, type ItemRef } from "../../services/data";
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
const magicTypeOptions: FilterOption[] = [
  {
    label: "All magic types",
    value: ALL_OPTION_VALUE,
  },
  {
    label: "Magic",
    value: String(MagicType.MAGIC),
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
    magicTypeOptions,
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
    magicType: MagicType.MAGIC,
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

describe("database surface", () => {
  test("shows a loading skeleton", () => {
    renderView({
      isLoading: true,
    });

    const status = screen.getByRole("status", { name: "Loading database" });

    expect(status)
      .toHaveAttribute("aria-busy", "true");
    expect(status.querySelectorAll(
      `.${itemListSkeletonStyles.SkeletonFilterControl}`,
    )).toHaveLength(3);
    expect(status.querySelectorAll(
      `.${itemListSkeletonStyles.SkeletonRowName}`,
    )).toHaveLength(10);
    expect(document.querySelector(
      `.${itemViewSkeletonStyles.SkeletonBackButton}`,
    )).toBeInTheDocument();
    expect(document.querySelectorAll(
      `.${itemViewSkeletonStyles.SkeletonField}`,
    )).toHaveLength(7);
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
        magicType: String(MagicType.MAGIC),
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
          magicTypeOptions={magicTypeOptions}
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

    await user.click(screen.getByRole("button", {
      name: "Back to item list",
    }));

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
          magicTypeOptions={emptyOptions}
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
    expect(creatorScreen.getByRole("button", { name: "Reset" }))
      .toHaveClass(drawerStyles.SecondaryButton);
    expect(creatorScreen.getByRole("button", { name: "Close" }))
      .toHaveClass(drawerStyles.SecondaryButton);
    expect(creatorScreen.getByRole("button", { name: "Save item" }))
      .toHaveClass(drawerStyles.SaveButton);
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

  test("uses magic type colour for list item names", () => {
    const { container } = render(
      <View
        classOptions={emptyOptions}
        filteredItems={[createExplorerItem()]}
        filters={DEFAULT_FILTERS}
        isLoading={false}
        itemTypeOptions={emptyOptions}
        magicTypeOptions={emptyOptions}
        onFilterChange={vi.fn()}
        onRetry={vi.fn()}
        onSelectItem={vi.fn()}
        onSortModeChange={vi.fn()}
        sortMode={DEFAULT_SORT_MODE}
        totalCount={1}
      />,
    );

    expect(screen.getByText("Azure Blade")).toHaveClass(
      itemListStyles.ViewMagicTypeMagic,
    );
    expect(container.querySelector(`.${itemListStyles.ViewListItemIcon}`))
      .not.toBeInTheDocument();
    expect(screen.queryByText("Game data")).not.toBeInTheDocument();
  });

  test("renders inventory images with the compact property layout", () => {
    const selectedItem = createExplorerItem({
      description: "A blade wrapped in cold light.",
      filename: "base/meta/Item/Azure_Blade",
      invImages: [[2100, 0]],
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
    const detailMagicTypeLabel = screen
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

    expect(inventory.getByText("Sorcerer")).toBeInTheDocument();
    expect(inventory.queryByText("Male")).not.toBeInTheDocument();
    expect(inventory.queryByText("Female")).not.toBeInTheDocument();
    expect(inventory.getByText("Male: 2100")).toHaveClass(
      itemViewStyles.ViewInventoryImage,
    );
    expect(inventory.getByText("Female: none")).toHaveClass(
      itemViewStyles.ViewInventoryMissing,
    );
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
    expect(detailNameLabel).not.toBeUndefined();
    expect(detailTransmogNameLabel).not.toBeUndefined();
    expect(detailSeriesLabel).not.toBeUndefined();
    expect(descriptionLabel).not.toBeUndefined();
    expect(detailItemIdLabel).not.toBeUndefined();
    expect(detailItemTypeLabel).not.toBeUndefined();
    expect(detailMagicTypeLabel).not.toBeUndefined();
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
        detailMagicTypeLabel as HTMLElement,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      (detailMagicTypeLabel as HTMLElement).compareDocumentPosition(
        detailPreferredZoneLabel as HTMLElement,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      (detailPreferredZoneLabel as HTMLElement).compareDocumentPosition(
        usableByClassesHeading,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const dataminedFileHeading = screen.getByRole("heading", {
      name: "Datamined File",
    });

    expect(
      (inventorySection as HTMLElement).compareDocumentPosition(
        dataminedFileHeading,
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByText("base/meta/Item/Azure_Blade"))
      .toHaveClass(itemViewStyles.ViewDataminedFileName);
    expect(screen.queryByRole("link", {
      name: "base/meta/Item/Azure_Blade",
    })).not.toBeInTheDocument();
  });

  test("fetches and renders datamined file json", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      json: vi.fn().mockResolvedValue({
        item: {
          id: 100,
          name: "Azure Blade",
          unsafe: "<script>alert(1)</script>",
        },
      }),
      ok: true,
    });
    const selectedItem = createExplorerItem({
      filename: "base/meta/Item/Azure_Blade",
    });
    vi.stubGlobal("fetch", fetchMock);

    renderView({
      filteredItems: [selectedItem],
      selectedItem,
      totalCount: 1,
    });

    const showJsonButton = screen.getByRole("button", { name: "Show JSON" });

    expect(showJsonButton).toHaveTextContent("▸");

    await user.click(showJsonButton);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("base/meta/Item/Azure_Blade.json"),
      {
        signal: expect.any(AbortSignal),
      },
    );

    const jsonPreview = await screen.findByLabelText("Datamined file JSON");

    expect(jsonPreview).toHaveClass(itemViewStyles.ViewJsonPreview);
    expect(jsonPreview.textContent).toContain('"name": "Azure Blade"');
    expect(jsonPreview.textContent).toContain(
      '"unsafe": "<script>alert(1)</script>"',
    );
    expect(jsonPreview.querySelector("script")).toBeNull();
    expect(screen.getByRole("button", { name: "Hide JSON" }))
      .toHaveTextContent("▾");
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

    await user.click(screen.getByRole("button", { name: "Show JSON" }));

    expect(await screen.findByRole("alert"))
      .toHaveTextContent("Failed to load JSON (404).");
    expect(screen.getByRole("button", { name: "Retry JSON" }))
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
        magicTypeOptions={emptyOptions}
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
        magicTypeOptions={emptyOptions}
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
        magicTypeOptions={emptyOptions}
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
        magicTypeOptions={emptyOptions}
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
        magicTypeOptions={emptyOptions}
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
