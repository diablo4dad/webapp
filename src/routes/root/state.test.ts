import {
  RootContent,
  closeRootContent,
  getInitialRootContentState,
  getRootMobileContentVisibility,
  openRootContent,
  toggleRootContent,
  toggleRootSidebarVisibility,
} from "./state";

describe("initial content", () => {
  test("starts on the ledger", () => {
    expect(getInitialRootContentState()).toEqual({
      content: RootContent.LEDGER,
      history: [RootContent.LEDGER],
    });
  });
});

describe("opening", () => {
  test("opens transient content without adding history", () => {
    expect(openRootContent([RootContent.LEDGER], RootContent.CONFIG)).toEqual({
      content: RootContent.CONFIG,
      history: [RootContent.LEDGER],
    });

    expect(openRootContent([RootContent.LEDGER], RootContent.SEARCH)).toEqual({
      content: RootContent.SEARCH,
      history: [RootContent.LEDGER],
    });
  });

  test("adds non-transient content once", () => {
    expect(openRootContent([], RootContent.LEDGER)).toEqual({
      content: RootContent.LEDGER,
      history: [RootContent.LEDGER],
    });

    expect(openRootContent([RootContent.LEDGER], RootContent.LEDGER)).toEqual({
      content: RootContent.LEDGER,
      history: [RootContent.LEDGER],
    });
  });
});

describe("closing", () => {
  test("returns to the most recent history entry", () => {
    expect(closeRootContent([RootContent.LEDGER])).toEqual({
      content: RootContent.LEDGER,
      history: [],
    });
  });

  test("falls back to the ledger without history", () => {
    expect(closeRootContent([])).toEqual({
      content: RootContent.LEDGER,
      history: [],
    });
  });
});

describe("toggling", () => {
  test("closes matching content", () => {
    expect(
      toggleRootContent(
        RootContent.CONFIG,
        [RootContent.LEDGER],
        RootContent.CONFIG,
      ),
    ).toEqual({
      content: RootContent.LEDGER,
      history: [],
    });
  });

  test("opens different content", () => {
    expect(
      toggleRootContent(
        RootContent.LEDGER,
        [RootContent.LEDGER],
        RootContent.CONFIG,
      ),
    ).toEqual({
      content: RootContent.CONFIG,
      history: [RootContent.LEDGER],
    });
  });
});

describe("sidebar visibility", () => {
  test("toggles one sidebar without changing the other", () => {
    expect(
      toggleRootSidebarVisibility(
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
      toggleRootSidebarVisibility(
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
    expect(getRootMobileContentVisibility(RootContent.LEDGER)).toEqual({
      isMobileConfigOpen: false,
      isMobileSearchOpen: false,
    });

    expect(getRootMobileContentVisibility(RootContent.CONFIG)).toEqual({
      isMobileConfigOpen: true,
      isMobileSearchOpen: false,
    });

    expect(getRootMobileContentVisibility(RootContent.SEARCH)).toEqual({
      isMobileConfigOpen: false,
      isMobileSearchOpen: true,
    });
  });
});
