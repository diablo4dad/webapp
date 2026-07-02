import { toggleSidebarVisibility } from "./state";

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
