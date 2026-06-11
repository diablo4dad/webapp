#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const https = require("https");

const EDITOR_ROLE = "EDITOR";
const OAUTH_SCOPE = "https://www.googleapis.com/auth/identitytoolkit";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const LOOKUP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:lookup";
const UPDATE_URL = "https://identitytoolkit.googleapis.com/v1/accounts:update";

function parseArgs(argv) {
  const options = {
    email: "",
    serviceAccount: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    projectId: undefined,
    tenantId: undefined,
    grant: false,
    revoke: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    switch (arg) {
      case "--email":
        options.email = next;
        i += 1;
        break;
      case "--service-account":
        options.serviceAccount = next;
        i += 1;
        break;
      case "--project-id":
        options.projectId = next;
        i += 1;
        break;
      case "--tenant-id":
        options.tenantId = next;
        i += 1;
        break;
      case "--grant":
        options.grant = true;
        break;
      case "--revoke":
        options.revoke = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--help":
      case "-h":
        printHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith("--")) {
          throw new Error(`Unknown argument: ${arg}`);
        }
        break;
    }
  }

  if (!options.email || !options.email.includes("@")) {
    throw new Error("Missing or invalid --email");
  }

  if (options.grant === options.revoke) {
    throw new Error("Specify exactly one of --grant or --revoke");
  }

  if (!options.dryRun && !options.serviceAccount) {
    throw new Error(
      "Missing --service-account. You can also set GOOGLE_APPLICATION_CREDENTIALS.",
    );
  }

  return options;
}

function printHelp() {
  console.log(`Usage: node scripts/set-editor-role.cjs [options]

Options:
  --email <address>          User email address to modify
  --grant                    Add the EDITOR role
  --revoke                   Remove the EDITOR role
  --service-account <path>   Service account JSON file
  --project-id <id>          Override GCP project id
  --tenant-id <id>           Optional Firebase Auth tenant id
  --dry-run                  Print the change without writing it
  --help                     Show this message
`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveFile(filePath, label) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`${label} not found: ${absolutePath}`);
  }

  return absolutePath;
}

function loadServiceAccount(serviceAccountPath) {
  const absolutePath = resolveFile(serviceAccountPath, "Service account file");
  const serviceAccount = readJson(absolutePath);

  const requiredFields = ["project_id", "client_email", "private_key"];
  for (const field of requiredFields) {
    if (typeof serviceAccount[field] !== "string" || serviceAccount[field].length === 0) {
      throw new Error(`Service account is missing required field: ${field}`);
    }
  }

  return {
    path: absolutePath,
    serviceAccount,
  };
}

function base64UrlEncode(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input);

  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createJwtAssertion(serviceAccount) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(
    JSON.stringify({
      alg: "RS256",
      typ: "JWT",
    }),
  );
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: OAUTH_SCOPE,
      aud: OAUTH_TOKEN_URL,
      iat: issuedAt,
      exp: issuedAt + 3600,
    }),
  );
  const unsignedToken = `${header}.${payload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const signature = base64UrlEncode(signer.sign(serviceAccount.private_key));

  return `${unsignedToken}.${signature}`;
}

function httpRequest(url, options = {}) {
  const target = new URL(url);
  const requestOptions = {
    method: options.method ?? "GET",
    hostname: target.hostname,
    path: `${target.pathname}${target.search}`,
    headers: options.headers ?? {},
  };

  return new Promise((resolve, reject) => {
    const request = https.request(requestOptions, (response) => {
      let body = "";

      response.setEncoding("utf8");
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        resolve({
          statusCode: response.statusCode ?? 0,
          body,
        });
      });
    });

    request.on("error", reject);

    if (options.body) {
      request.write(options.body);
    }

    request.end();
  });
}

function parseJsonResponse(body, fallbackLabel) {
  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error(`${fallbackLabel}: ${body.slice(0, 500)}`);
  }
}

async function fetchAccessToken(serviceAccount) {
  const assertion = createJwtAssertion(serviceAccount);
  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  }).toString();

  const response = await httpRequest(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": Buffer.byteLength(body),
    },
    body,
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `OAuth token request failed (${response.statusCode}): ${response.body.slice(0, 500)}`,
    );
  }

  const data = parseJsonResponse(response.body, "Invalid OAuth token response");
  if (typeof data.access_token !== "string" || data.access_token.length === 0) {
    throw new Error("OAuth token response is missing access_token");
  }

  return data.access_token;
}

async function postJson(url, accessToken, payload) {
  const body = JSON.stringify(payload);
  const response = await httpRequest(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(body),
    },
    body,
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `Request failed (${response.statusCode}) ${url}: ${response.body.slice(0, 500)}`,
    );
  }

  return parseJsonResponse(response.body, `Invalid JSON response from ${url}`);
}

function parseCustomClaims(customAttributes) {
  if (!customAttributes) {
    return {};
  }

  try {
    const claims = JSON.parse(customAttributes);
    if (claims && typeof claims === "object" && !Array.isArray(claims)) {
      return claims;
    }
  } catch (error) {
    throw new Error(`User has invalid customAttributes JSON: ${customAttributes}`);
  }

  throw new Error("User customAttributes must be a JSON object");
}

function buildNextClaims(currentClaims, grant) {
  const nextClaims = { ...currentClaims };
  const roles = new Set();

  if (typeof currentClaims.role === "string" && currentClaims.role.length > 0) {
    roles.add(currentClaims.role);
  }

  if (Array.isArray(currentClaims.roles)) {
    currentClaims.roles
      .filter((role) => typeof role === "string" && role.length > 0)
      .forEach((role) => roles.add(role));
  }

  if (grant) {
    roles.add(EDITOR_ROLE);
    nextClaims.editor = true;
  } else {
    roles.delete(EDITOR_ROLE);
    delete nextClaims.editor;

    if (nextClaims.role === EDITOR_ROLE) {
      delete nextClaims.role;
    }
  }

  if (roles.size === 0) {
    delete nextClaims.roles;
  } else {
    nextClaims.roles = Array.from(roles.values()).sort();
  }

  if (grant && nextClaims.role === undefined) {
    nextClaims.role = EDITOR_ROLE;
  }

  return nextClaims;
}

function claimsChanged(currentClaims, nextClaims) {
  return JSON.stringify(currentClaims) !== JSON.stringify(nextClaims);
}

function validateCustomClaimsSize(claims) {
  const serialized = JSON.stringify(claims);
  if (serialized.length > 1000) {
    throw new Error(
      `Custom claims exceed the 1000 character limit (${serialized.length}).`,
    );
  }

  return serialized;
}

async function lookupUserByEmail(accessToken, projectId, email, tenantId) {
  const payload = {
    email: [email],
    targetProjectId: projectId,
  };

  if (tenantId) {
    payload.tenantId = tenantId;
  }

  const response = await postJson(LOOKUP_URL, accessToken, payload);
  const users = Array.isArray(response.users) ? response.users : [];

  if (users.length === 0) {
    throw new Error(`No Firebase Auth user found for email "${email}"`);
  }

  if (users.length > 1) {
    throw new Error(
      `Multiple Firebase Auth users matched "${email}". Specify --tenant-id if needed.`,
    );
  }

  return users[0];
}

async function updateUserClaims(accessToken, projectId, localId, tenantId, claims) {
  const payload = {
    localId,
    customAttributes: validateCustomClaimsSize(claims),
    targetProjectId: projectId,
  };

  if (tenantId) {
    payload.tenantId = tenantId;
  }

  return postJson(UPDATE_URL, accessToken, payload);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.dryRun && !options.serviceAccount) {
    console.log(
      JSON.stringify(
        {
          email: options.email,
          action: options.grant ? "grant" : "revoke",
          projectId: options.projectId ?? null,
          tenantId: options.tenantId ?? null,
          dryRun: true,
        },
        null,
        2,
      ),
    );
    return;
  }

  const { path: serviceAccountPath, serviceAccount } = loadServiceAccount(
    options.serviceAccount,
  );
  const projectId = options.projectId ?? serviceAccount.project_id;
  const accessToken = await fetchAccessToken(serviceAccount);
  const user = await lookupUserByEmail(
    accessToken,
    projectId,
    options.email,
    options.tenantId,
  );
  const currentClaims = parseCustomClaims(user.customAttributes);
  const nextClaims = buildNextClaims(currentClaims, options.grant);
  const changed = claimsChanged(currentClaims, nextClaims);

  console.log(
    JSON.stringify(
      {
        email: user.email ?? options.email,
        uid: user.localId,
        projectId,
        tenantId: options.tenantId ?? null,
        serviceAccountPath,
        action: options.grant ? "grant" : "revoke",
        dryRun: options.dryRun,
        changed,
        currentClaims,
        nextClaims,
      },
      null,
      2,
    ),
  );

  if (!changed) {
    console.log("[editor-role] No claim update needed.");
    return;
  }

  if (options.dryRun) {
    console.log("[editor-role] Dry run only. No claim update was written.");
    return;
  }

  await updateUserClaims(
    accessToken,
    projectId,
    user.localId,
    options.tenantId,
    nextClaims,
  );

  console.log(
    `[editor-role] ${options.grant ? "Granted" : "Revoked"} ${EDITOR_ROLE} for ${user.email}.`,
  );
}

if (require.main === module) {
  main().catch((error) => {
    console.error(
      `[editor-role] ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  });
}

module.exports = {
  buildNextClaims,
  claimsChanged,
  parseCustomClaims,
  validateCustomClaimsSize,
};
