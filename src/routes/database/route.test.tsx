import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  MemoryRouter,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import {
  MagicType,
  type DadDbRef,
} from "../../services/data";
import { Component } from "./route";

const mocks = vi.hoisted(() => ({
  fetchStaticDadDbRef: vi.fn(),
}));
const originalOffsetHeight = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetHeight",
);
const originalOffsetWidth = Object.getOwnPropertyDescriptor(
  HTMLElement.prototype,
  "offsetWidth",
);

vi.mock("../../services/store/catalog", () => ({
  fetchStaticDadDbRef: mocks.fetchStaticDadDbRef,
}));

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

beforeEach(() => {
  vi.resetAllMocks();
  mocks.fetchStaticDadDbRef.mockResolvedValue(dadDbRef());
});

describe("database route", () => {
  test("renders loaded database results for everyone", async () => {
    renderRoute("/database", "helm");

    expect(screen.getByRole("status", { name: "Loading database" }))
      .toHaveAttribute("aria-busy", "true");
    expect(await screen.findByRole("heading", {
      name: "Database Explorer",
    })).toBeInTheDocument();
    expect(await screen.findAllByText("Azure Helm"))
      .not.toHaveLength(0);
    expect(screen.queryByText("Crimson Sword")).not.toBeInTheDocument();
  });

  test("uses selected item id from the route", async () => {
    renderRoute("/database/102");

    expect(await screen.findAllByText("Crimson Sword"))
      .not.toHaveLength(0);
    expect(screen.getAllByText("102")).not.toHaveLength(0);
  });

  test("routes selected item changes", async () => {
    const user = userEvent.setup();

    renderRoute("/database/102");

    const list = await screen.findByLabelText("Database item results");
    await user.click(await within(list).findByRole("button", {
      name: /Azure Helm/,
    }));

    await waitFor(() => {
      expect(screen.getByTestId("location")).toHaveTextContent(
        "/database/101",
      );
    });
  });

  test("shows load errors and retries", async () => {
    const user = userEvent.setup();

    mocks.fetchStaticDadDbRef
      .mockRejectedValueOnce(new Error("catalog failed"))
      .mockResolvedValueOnce(dadDbRef());

    renderRoute();

    expect(await screen.findByText("catalog failed")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findAllByText("Azure Helm"))
      .not.toHaveLength(0);
    expect(mocks.fetchStaticDadDbRef).toHaveBeenCalledTimes(2);
  });

  test("registers database shell controls", () => {
    const { rootContext } = renderRoute();

    expect(rootContext.setRootShellControls).toHaveBeenCalledWith({
      isContentConstrained: false,
      isFooterVisible: true,
      searchPlaceholder: "Search database",
      searchTitle: "Database Search",
      showCollectionControls: false,
      showSearch: true,
    });
  });
});

function dadDbRef(): DadDbRef {
  return {
    collections: [],
    itemTypes: [
      {
        id: 1,
        name: "Helm",
      },
      {
        id: 2,
        name: "Sword",
      },
    ],
    items: [
      {
        icon: 1,
        id: 101,
        itemType: 1,
        magicType: MagicType.MAGIC,
        name: "Azure Helm",
      },
      {
        icon: 2,
        id: 102,
        itemType: 2,
        magicType: MagicType.LEGENDARY,
        name: "Crimson Sword",
      },
    ],
  };
}

function renderRoute(initialEntry = "/database", searchTerm = "") {
  const rootContext = {
    onSearchChange: vi.fn(),
    searchTerm,
    setRootShellControls: vi.fn(),
    sidebarVisibility: {
      showConfig: true,
      showItem: true,
    },
  };
  const renderResult = render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route
          path="/"
          element={(
            <>
              <LocationProbe />
              <Outlet context={rootContext} />
            </>
          )}
        >
          <Route path="database" element={<Component />} />
          <Route path="database/:itemId" element={<Component />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

  return {
    ...renderResult,
    rootContext,
  };
}

function LocationProbe() {
  const location = useLocation();

  return <div data-testid="location">{location.pathname}</div>;
}
