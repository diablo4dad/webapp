import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { ItemSidebarSkeleton } from "./skeleton";

describe("item sidebar skeleton", () => {
  test("renders as a standalone loading placeholder", () => {
    render(<ItemSidebarSkeleton />);

    expect(screen.getByRole("status", { name: "Loading item details" }))
      .toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("Collected")).not.toBeInTheDocument();
  });
});
