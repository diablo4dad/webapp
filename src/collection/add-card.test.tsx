import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { AddCard } from "./add-card";

describe("add card", () => {
  test("renders the label and forwards clicks", () => {
    const onClick = vi.fn();

    render(<AddCard label="Add Item" onClick={onClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Item" }));

    expect(onClick).toHaveBeenCalledOnce();
  });
});
