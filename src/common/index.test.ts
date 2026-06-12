import {
  constrainSidebarVisibility,
  getSidebarVisibilityPreference,
} from "./index";

describe("constrainSidebarVisibility", () => {
  test("allows both sidebars when the viewport can support them", () => {
    expect(
      constrainSidebarVisibility(
        {
          showConfig: true,
          showItem: true,
        },
        true,
      ),
    ).toEqual({
      showConfig: true,
      showItem: true,
    });
  });

  test("keeps the item sidebar by default when both sidebars are constrained", () => {
    expect(
      constrainSidebarVisibility(
        {
          showConfig: true,
          showItem: true,
        },
        false,
      ),
    ).toEqual({
      showConfig: false,
      showItem: true,
    });
  });

  test("keeps the preferred sidebar when both sidebars are constrained", () => {
    expect(
      constrainSidebarVisibility(
        {
          showConfig: true,
          showItem: true,
        },
        false,
        "config",
      ),
    ).toEqual({
      showConfig: true,
      showItem: false,
    });
  });

  test("allows both sidebars to be hidden when sidebars are constrained", () => {
    expect(
      constrainSidebarVisibility(
        {
          showConfig: false,
          showItem: false,
        },
        false,
      ),
    ).toEqual({
      showConfig: false,
      showItem: false,
    });
  });
});

describe("getSidebarVisibilityPreference", () => {
  test("prefers the sidebar that was opened", () => {
    expect(
      getSidebarVisibilityPreference(
        {
          showConfig: false,
          showItem: true,
        },
        {
          showConfig: true,
          showItem: true,
        },
      ),
    ).toBe("config");

    expect(
      getSidebarVisibilityPreference(
        {
          showConfig: true,
          showItem: false,
        },
        {
          showConfig: true,
          showItem: true,
        },
      ),
    ).toBe("item");
  });
});
