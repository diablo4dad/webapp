import React from "react";
import { act, render } from "@testing-library/react";
import { vi } from "vitest";
import { Application } from "./Application";

vi.mock("../store/catalog", () => ({
  __esModule: true,
  fetchHybridDadDbRef: vi.fn(() =>
    Promise.resolve({
      collections: [],
      items: [],
      itemTypes: [],
    }),
  ),
}));

test("renders without crashing", async () => {
  await act(async () => {
    render(<Application />);
    await Promise.resolve();
  });
});
