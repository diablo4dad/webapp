type RuntimeEnv = Pick<ImportMetaEnv, "MODE"> & {
  VITE_FIREBASE_EMULATORS?: string;
};

type RuntimeOptions = {
  env?: RuntimeEnv;
  hostname?: string;
};

const FIREBASE_EMULATOR_HOST = "127.0.0.1";
const FIREBASE_AUTH_EMULATOR_ORIGIN = "http://127.0.0.1:9099";
const FIREBASE_FIRESTORE_EMULATOR_PORT = 8080;
const FIREBASE_FUNCTIONS_EMULATOR_ORIGIN = "http://127.0.0.1:5001";
const FIREBASE_STORAGE_EMULATOR_ORIGIN = "http://127.0.0.1:9199";
const FIREBASE_STORAGE_EMULATOR_PORT = 9199;
const LOCAL_EMULATOR_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "[::1]",
]);

function shouldUseFirebaseEmulators(options: RuntimeOptions = {}): boolean {
  const env = options.env ?? import.meta.env;
  const flag = env.VITE_FIREBASE_EMULATORS?.trim().toLowerCase();

  if (flag === "true" || flag === "1") {
    return true;
  }

  if (flag === "false" || flag === "0") {
    return false;
  }

  if (env.MODE === "test") {
    return false;
  }

  const hostname = options.hostname ?? getCurrentHostname();

  return hostname ? LOCAL_EMULATOR_HOSTNAMES.has(hostname) : false;
}

function getStorageEmulatorDownloadUrl(
  bucket: string,
  objectPath: string,
): string {
  return (
    `${FIREBASE_STORAGE_EMULATOR_ORIGIN}/v0/b/` +
    `${encodeURIComponent(bucket)}/o/${encodeURIComponent(objectPath)}` +
    "?alt=media"
  );
}

function getCurrentHostname(): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  return window.location.hostname;
}

export {
  FIREBASE_AUTH_EMULATOR_ORIGIN,
  FIREBASE_EMULATOR_HOST,
  FIREBASE_FIRESTORE_EMULATOR_PORT,
  FIREBASE_FUNCTIONS_EMULATOR_ORIGIN,
  FIREBASE_STORAGE_EMULATOR_ORIGIN,
  FIREBASE_STORAGE_EMULATOR_PORT,
  getStorageEmulatorDownloadUrl,
  shouldUseFirebaseEmulators,
};
