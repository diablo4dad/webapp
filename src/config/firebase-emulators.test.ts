import {
  getStorageEmulatorDownloadUrl,
  shouldUseFirebaseEmulators,
} from "./firebase-emulators";

describe("Firebase emulator config", () => {
  test("honours explicit emulator opt in", () => {
    expect(
      shouldUseFirebaseEmulators({
        env: {
          MODE: "test",
          VITE_FIREBASE_EMULATORS: "true",
        },
        hostname: "example.com",
      }),
    ).toBe(true);
  });

  test("honours explicit emulator opt out", () => {
    expect(
      shouldUseFirebaseEmulators({
        env: {
          MODE: "development",
          VITE_FIREBASE_EMULATORS: "false",
        },
        hostname: "localhost",
      }),
    ).toBe(false);
  });

  test("uses emulators for local browser hosts outside tests", () => {
    expect(
      shouldUseFirebaseEmulators({
        env: {
          MODE: "production",
        },
        hostname: "127.0.0.1",
      }),
    ).toBe(true);
  });

  test("builds Storage emulator object URLs", () => {
    expect(
      getStorageEmulatorDownloadUrl(
        "d4log-bfc60.appspot.com",
        "icons/100.webp",
      ),
    ).toBe(
      "http://127.0.0.1:9199/v0/b/d4log-bfc60.appspot.com/o/icons%2F100.webp?alt=media",
    );
  });
});
