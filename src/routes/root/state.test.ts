import {
  Content,
  closeContent,
  getInitialContentState,
  getMobileContentVisibility,
  openContent,
  toggleContent,
  toggleSidebarVisibility,
} from "./state";

describe("initial content", () => {
  test("starts on the ledger", () => {
    expect(getInitialContentState()).toEqual({
      content: Content.LEDGER,
      history: [Content.LEDGER],
    });
  });
});

describe("opening", () => {
  test("opens transient content without adding history", () => {
    expect(openContent([Content.LEDGER], Content.CONFIG)).toEqual({
      content: Content.CONFIG,
      history: [Content.LEDGER],
    });

    expect(openContent([Content.LEDGER], Content.SEARCH)).toEqual({
      content: Content.SEARCH,
      history: [Content.LEDGER],
    });
  });

  test("adds non-transient content once", () => {
    expect(openContent([], Content.LEDGER)).toEqual({
      content: Content.LEDGER,
      history: [Content.LEDGER],
    });

    expect(openContent([Content.LEDGER], Content.LEDGER)).toEqual({
      content: Content.LEDGER,
      history: [Content.LEDGER],
    });
  });
});

describe("closing", () => {
  test("returns to the most recent history entry", () => {
    expect(closeContent([Content.LEDGER])).toEqual({
      content: Content.LEDGER,
      history: [],
    });
  });

  test("falls back to the ledger without history", () => {
    expect(closeContent([])).toEqual({
      content: Content.LEDGER,
      history: [],
    });
  });
});

describe("toggling", () => {
  test("closes matching content", () => {
    expect(
      toggleContent(
        Content.CONFIG,
        [Content.LEDGER],
        Content.CONFIG,
      ),
    ).toEqual({
      content: Content.LEDGER,
      history: [],
    });
  });

  test("opens different content", () => {
    expect(
      toggleContent(
        Content.LEDGER,
        [Content.LEDGER],
        Content.CONFIG,
      ),
    ).toEqual({
      content: Content.CONFIG,
      history: [Content.LEDGER],
    });
  });
});

describe("sidebar visibility", () => {
  test("toggles one sidebar without changing the other", () => {
    expect(
      toggleSidebarVisibility(
        {
          showConfig: true,
          showItem: false,
        },
        "showItem",
      ),
    ).toEqual({
      showConfig: true,
      showItem: true,
    });

    expect(
      toggleSidebarVisibility(
        {
          showConfig: true,
          showItem: false,
        },
        "showConfig",
      ),
    ).toEqual({
      showConfig: false,
      showItem: false,
    });
  });
});

describe("mobile content visibility", () => {
  test("opens the matching mobile content surface", () => {
    expect(getMobileContentVisibility(Content.LEDGER)).toEqual({
      isMobileConfigOpen: false,
      isMobileSearchOpen: false,
    });

    expect(getMobileContentVisibility(Content.CONFIG)).toEqual({
      isMobileConfigOpen: true,
      isMobileSearchOpen: false,
    });

    expect(getMobileContentVisibility(Content.SEARCH)).toEqual({
      isMobileConfigOpen: false,
      isMobileSearchOpen: true,
    });
  });
});
