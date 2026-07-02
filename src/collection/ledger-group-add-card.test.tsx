import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { LedgerGroupAddCard } from "./ledger-group-add-card";

describe("ledger group add card", () => {
  test("renders the label and forwards clicks", () => {
    const onClick = vi.fn();

    render(<LedgerGroupAddCard label="Add Item" onClick={onClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Item" }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
