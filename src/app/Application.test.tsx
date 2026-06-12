import React from "react";
import { act, render } from "@testing-library/react";
import { Application } from "./Application";

jest.mock("../store/catalog", () => ({
  __esModule: true,
  fetchHybridDadDbRef: jest.fn(() =>
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
