import { vi } from "vitest";
import { getIcon } from "./index";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("bucket URLs", () => {
  test("uses Storage emulator URLs when emulators are enabled", () => {
    vi.stubEnv("VITE_FIREBASE_EMULATORS", "true");

    expect(getIcon("icons/100.webp")).toBe(
      "http://127.0.0.1:9199/v0/b/d4log-bfc60.appspot.com/o/icons%2F100.webp?alt=media",
    );
  });
});
