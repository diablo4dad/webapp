import { ContentType } from "../../common";
import {
  closeRootContent,
  getInitialRootContentState,
  openRootContent,
  toggleRootContent,
} from "./state";

describe("initial content", () => {
  test("starts on the ledger", () => {
    expect(getInitialRootContentState()).toEqual({
      content: ContentType.LEDGER,
      history: [ContentType.LEDGER],
    });
  });
});

describe("opening", () => {
  test("opens transient content without adding history", () => {
    expect(openRootContent([ContentType.LEDGER], ContentType.CONFIG)).toEqual({
      content: ContentType.CONFIG,
      history: [ContentType.LEDGER],
    });

    expect(openRootContent([ContentType.LEDGER], ContentType.SEARCH)).toEqual({
      content: ContentType.SEARCH,
      history: [ContentType.LEDGER],
    });
  });

  test("adds non-transient content once", () => {
    expect(openRootContent([], ContentType.LEDGER)).toEqual({
      content: ContentType.LEDGER,
      history: [ContentType.LEDGER],
    });

    expect(openRootContent([ContentType.LEDGER], ContentType.LEDGER)).toEqual({
      content: ContentType.LEDGER,
      history: [ContentType.LEDGER],
    });
  });
});

describe("closing", () => {
  test("returns to the most recent history entry", () => {
    expect(closeRootContent([ContentType.LEDGER])).toEqual({
      content: ContentType.LEDGER,
      history: [],
    });
  });

  test("falls back to the ledger without history", () => {
    expect(closeRootContent([])).toEqual({
      content: ContentType.LEDGER,
      history: [],
    });
  });
});

describe("toggling", () => {
  test("closes matching content", () => {
    expect(
      toggleRootContent(
        ContentType.CONFIG,
        [ContentType.LEDGER],
        ContentType.CONFIG,
      ),
    ).toEqual({
      content: ContentType.LEDGER,
      history: [],
    });
  });

  test("opens different content", () => {
    expect(
      toggleRootContent(
        ContentType.LEDGER,
        [ContentType.LEDGER],
        ContentType.CONFIG,
      ),
    ).toEqual({
      content: ContentType.CONFIG,
      history: [ContentType.LEDGER],
    });
  });
});
