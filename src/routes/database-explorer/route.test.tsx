import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Outlet, Route, Routes } from "react-router-dom";
import { describe, expect, test, vi } from "vitest";
import { Component } from "./route";

vi.mock("../../features/database-explorer", () => ({
  DatabaseExplorer: ({
    onSelectItemIdChange,
    searchTerm,
    selectedItemId,
  }: {
    onSelectItemIdChange: (itemId: number) => void;
    searchTerm: string;
    selectedItemId?: number;
  }) => (
    <div>
      <div>database explorer</div>
      <div>database search {searchTerm}</div>
      <div>selected item {selectedItemId ?? "none"}</div>
      <button type="button" onClick={() => onSelectItemIdChange(101)}>
        select item
      </button>
    </div>
  ),
}));

describe("database explorer route", () => {
  test("renders for everyone", () => {
    renderRoute("/database", "helm");

    expect(screen.getByText("database explorer")).toBeInTheDocument();
    expect(screen.getByText("database search helm")).toBeInTheDocument();
  });

  test("passes selected item id from the route", () => {
    renderRoute("/database/102");

    expect(screen.getByText("selected item 102")).toBeInTheDocument();
  });

  test("routes selected item changes", async () => {
    const user = userEvent.setup();

    renderRoute("/database/102");

    await user.click(screen.getByRole("button", { name: "select item" }));
    expect(screen.getByText("selected item 101")).toBeInTheDocument();
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
        <Route path="/" element={<Outlet context={rootContext} />}>
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
