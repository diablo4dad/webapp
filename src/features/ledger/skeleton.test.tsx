import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import {
  LedgerView,
  Option,
  SettingsProvider,
  defaultSettings,
} from "../settings";
import CollectionSkeleton from "./skeleton";

describe("collection skeleton", () => {
  test("uses the default ledger card layout", () => {
    render(<CollectionSkeleton />);

    expect(screen.getByRole("status", { name: "Loading collection log" }))
      .toHaveAttribute("data-ledger-view", "card");
  });

  test("matches the configured ledger layout mode", () => {
    render(
      <SettingsProvider
        settings={{
          ...defaultSettings,
          [Option.LEDGER_VIEW]: LedgerView.LIST,
        }}
      >
        <CollectionSkeleton />
      </SettingsProvider>,
    );

    expect(screen.getByRole("status", { name: "Loading collection log" }))
      .toHaveAttribute("data-ledger-view", "list");
  });
});
