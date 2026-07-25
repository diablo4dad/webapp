#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execFileSync, spawn } = require("child_process");

const DEFAULT_STATE_DIR = path.join("tmp", "emulators");
const FIREBASE_JSON_PATH = "firebase.json";
const FIREBASE_RC_PATH = ".firebaserc";
const FORCE_SHUTDOWN_AFTER_MS = 10_000;
const STALE_PORT_WAIT_MS = 5_000;
const FIREBASE_CLI_RELATIVE_PATH = path.join(
  "firebase-tools",
  "lib",
  "bin",
  "firebase.js",
);
const SHUTDOWN_SIGNALS = process.platform === "win32"
  ? ["SIGINT", "SIGTERM", "SIGBREAK"]
  : ["SIGINT", "SIGTERM", "SIGHUP"];

function parseArgs(argv) {
  const options = {
    clearStalePorts: true,
    exportOnExit: true,
    importData: true,
    only: undefined,
    stateDir: DEFAULT_STATE_DIR,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case "--only":
        options.only = next;
        i += 1;
        break;
      case "--state-dir":
        options.stateDir = next;
        i += 1;
        break;
      case "--no-export":
        options.exportOnExit = false;
        break;
      case "--no-import":
        options.importData = false;
        break;
      case "--no-clear-stale":
        options.clearStalePorts = false;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/start-emulators.cjs [options]

Options:
  --only <list>             Comma-separated emulator list
  --state-dir <path>        Import/export directory (default: tmp/emulators)
  --no-import               Do not import saved emulator state
  --no-export               Do not export state on exit
  --no-clear-stale          Do not clear existing Windows emulator port owners
  --help                    Show this message
`);
}

function buildFirebaseArgs(options) {
  const args = ["emulators:start"];
  const stateDir = path.resolve(options.stateDir);

  if (options.only) {
    args.push("--only", options.only);
  }

  if (options.importData && fs.existsSync(stateDir)) {
    args.push("--import", stateDir);
  }

  if (options.exportOnExit) {
    args.push("--export-on-exit", stateDir);
  }

  return args;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const args = buildFirebaseArgs(options);
  clearStaleEmulatorPorts(options);
  const command = resolveFirebaseCommand();
  const child = spawn(command.command, command.args.concat(args), {
    detached: process.platform !== "win32",
    stdio: "inherit",
    windowsHide: true,
  });
  const shutdown = createShutdownHandler(child);

  child.on("error", (error) => {
    shutdown.dispose();
    console.error(`[emulators] Failed to start Firebase CLI: ${error.message}`);
    process.exit(1);
  });

  child.on("exit", (code, signal) => {
    shutdown.dispose();

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });

  shutdown.register();
}

function resolveFirebaseCommand() {
  const cliScript = resolveFirebaseCliScript();

  if (cliScript) {
    return {
      args: [cliScript],
      command: process.execPath,
    };
  }

  return {
    args: [],
    command: "firebase",
  };
}

function resolveFirebaseCliScript() {
  const candidates = [
    resolveLocalFirebaseCliScript(),
    resolveAppDataFirebaseCliScript(),
    resolveNpmPrefixFirebaseCliScript(),
  ];

  return candidates.find((candidate) => candidate && fs.existsSync(candidate));
}

function resolveLocalFirebaseCliScript() {
  try {
    return require.resolve("firebase-tools/lib/bin/firebase.js");
  } catch {
    return undefined;
  }
}

function resolveAppDataFirebaseCliScript() {
  if (!process.env.APPDATA) {
    return undefined;
  }

  return path.join(
    process.env.APPDATA,
    "npm",
    "node_modules",
    FIREBASE_CLI_RELATIVE_PATH,
  );
}

function resolveNpmPrefixFirebaseCliScript() {
  if (!process.env.npm_config_prefix) {
    return undefined;
  }

  return path.join(
    process.env.npm_config_prefix,
    "node_modules",
    FIREBASE_CLI_RELATIVE_PATH,
  );
}

function createShutdownHandler(child) {
  let forceTimer;
  let isStopping = false;

  const handlers = SHUTDOWN_SIGNALS.map((signal) => ({
    handler: () => {
      if (isStopping) {
        forceStopChildProcessTree(child);
        return;
      }

      isStopping = true;
      console.log(`[emulators] Received ${signal}; stopping emulators...`);
      stopChildProcessTree(child, signal);

      forceTimer = setTimeout(() => {
        if (isChildRunning(child)) {
          console.warn(
            "[emulators] Emulator shutdown timed out; forcing process tree stop.",
          );
          forceStopChildProcessTree(child);
        }
      }, FORCE_SHUTDOWN_AFTER_MS);
      forceTimer.unref?.();
    },
    signal,
  }));

  return {
    dispose() {
      if (forceTimer) {
        clearTimeout(forceTimer);
        forceTimer = undefined;
      }

      for (const { handler, signal } of handlers) {
        process.removeListener(signal, handler);
      }
    },
    register() {
      for (const { handler, signal } of handlers) {
        process.once(signal, handler);
      }
    },
  };
}

function isChildRunning(child) {
  return child.exitCode === null && child.signalCode === null;
}

function stopChildProcessTree(child, signal) {
  if (!isChildRunning(child)) {
    return;
  }

  if (process.platform === "win32") {
    runTaskkill(child.pid, false);
    return;
  }

  killPosixProcessGroup(child.pid, signal);
}

function forceStopChildProcessTree(child) {
  if (!isChildRunning(child)) {
    return;
  }

  if (process.platform === "win32") {
    runTaskkill(child.pid, true);
    return;
  }

  killPosixProcessGroup(child.pid, "SIGKILL");
}

function runTaskkill(pid, force) {
  if (typeof pid !== "number") {
    return;
  }

  spawn(
    "taskkill",
    force ? ["/pid", String(pid), "/t", "/f"] : ["/pid", String(pid), "/t"],
    {
      stdio: "ignore",
      windowsHide: true,
    },
  );
}

function killPosixProcessGroup(pid, signal) {
  if (typeof pid !== "number") {
    return;
  }

  try {
    process.kill(-pid, signal);
  } catch {
    try {
      process.kill(pid, signal);
    } catch {
      // Process has already exited.
    }
  }
}

function clearStaleEmulatorPorts(options) {
  if (process.platform !== "win32" || !options.clearStalePorts) {
    return;
  }

  const ports = getConfiguredEmulatorPorts(options.only);
  const projectId = getFirebaseProjectId();

  for (const { name, port } of ports) {
    const pids = getListeningPids(port);

    for (const pid of pids) {
      const processInfo = getWindowsProcessInfo(pid);

      if (isFirebaseEmulatorProcess(processInfo, projectId)) {
        console.warn(
          `[emulators] Clearing existing ${name} emulator process ${pid} on port ${port}.`,
        );
        runTaskkillSync(pid);

        if (!waitForPortToClose(port, STALE_PORT_WAIT_MS)) {
          throw new Error(
            `Timed out while clearing existing ${name} emulator process on port ${port}.`,
          );
        }

        continue;
      }

      throw new Error(createPortInUseMessage(name, port, pid, processInfo));
    }
  }
}

function getConfiguredEmulatorPorts(only) {
  const firebaseJson = readJsonFile(FIREBASE_JSON_PATH);
  const selectedNames = only
    ? new Set(only.split(",").map((name) => name.trim()).filter(Boolean))
    : undefined;

  return Object.entries(firebaseJson.emulators ?? {})
    .filter(([name]) => {
      if (name === "singleProjectMode") {
        return false;
      }

      return !selectedNames || selectedNames.has(name) || name === "ui";
    })
    .flatMap(([name, config]) => {
      const port = config && typeof config === "object"
        ? config.port
        : undefined;

      return Number.isInteger(port)
        ? [{
          name,
          port,
        }]
        : [];
    });
}

function getFirebaseProjectId() {
  const firebaseRc = readJsonFile(FIREBASE_RC_PATH, {});
  const defaultProject = firebaseRc.projects?.default;

  return typeof defaultProject === "string" ? defaultProject : undefined;
}

function readJsonFile(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    if (fallback !== undefined) {
      return fallback;
    }

    throw error;
  }
}

function getListeningPids(port) {
  let output;

  try {
    output = execFileSync("netstat", ["-ano", "-p", "tcp"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return [];
  }

  return Array.from(
    new Set(
      output
        .split(/\r?\n/)
        .map((line) => line.trim().split(/\s+/))
        .filter((columns) =>
          columns[0] === "TCP" &&
          columns[1]?.endsWith(`:${port}`) &&
          columns[3] === "LISTENING")
        .map((columns) => Number(columns[4]))
        .filter(Number.isInteger),
    ),
  );
}

function getWindowsProcessInfo(pid) {
  try {
    const command =
      `Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}" | ` +
      "Select-Object ProcessId,ParentProcessId,Name,CommandLine | " +
      "ConvertTo-Json -Compress";
    const output = execFileSync(
      "powershell.exe",
      ["-NoProfile", "-Command", command],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      },
    ).trim();

    return output ? JSON.parse(output) : undefined;
  } catch {
    return undefined;
  }
}

function isFirebaseEmulatorProcess(processInfo, projectId) {
  const commandLine = String(processInfo?.CommandLine ?? "").toLowerCase();
  const projectText = projectId ? projectId.toLowerCase() : undefined;
  const looksLikeFirebaseCli =
    commandLine.includes("firebase-tools") ||
    commandLine.includes("firebase\\tools") ||
    commandLine.includes("firebase/tools");
  const looksLikeEmulatorRuntime =
    commandLine.includes(".cache\\firebase\\emulators") ||
    commandLine.includes(".cache/firebase/emulators");

  return looksLikeFirebaseCli ||
    (looksLikeEmulatorRuntime &&
      (!projectText || commandLine.includes(projectText)));
}

function runTaskkillSync(pid) {
  execFileSync("taskkill", ["/pid", String(pid), "/t", "/f"], {
    stdio: "ignore",
    windowsHide: true,
  });
}

function waitForPortToClose(port, timeoutMs) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    if (getListeningPids(port).length === 0) {
      return true;
    }

    sleep(250);
  }

  return getListeningPids(port).length === 0;
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function createPortInUseMessage(name, port, pid, processInfo) {
  const processName = processInfo?.Name ? ` (${processInfo.Name})` : "";

  return (
    `Cannot start ${name} emulator because port ${port} is already used ` +
    `by process ${pid}${processName}. Stop that process or choose a different ` +
    "emulator port in firebase.json."
  );
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(
      `[emulators] ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}
