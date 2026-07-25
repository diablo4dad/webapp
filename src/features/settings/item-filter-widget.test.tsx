import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { ItemFilterWidget } from "./item-filter-widget";

describe("item filter widget", () => {
  test("shows owned and total counts by default", () => {
    render(
      <ItemFilterWidget
        active={true}
        count={{ owned: 3, total: 12 }}
        label="Armor"
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Armor\s*3\/12/ }))
      .toBeInTheDocument();
  });

  test("can show only total count", () => {
    render(
      <ItemFilterWidget
        active={true}
        count={{ owned: 3, total: 12 }}
        countDisplay="total"
        label="Armor"
        onClick={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /Armor\s*12/ }))
      .toBeInTheDocument();
    expect(screen.queryByText("3/12")).not.toBeInTheDocument();
  });
});
