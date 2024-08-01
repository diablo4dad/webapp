const VERSION = { major: 1, minor: 7, revision: 2 };
const SITE_VERSION = `${VERSION.major}.${VERSION.minor}.${VERSION.revision}`;
const LAST_UPDATED = "August 1st, 2024";
const DISCORD_INVITE_LINK = "https://discord.gg/mPRBrU2kYT";
const MODE = process.env.NODE_ENV === "production" ? "static" : "live";
// const MODE = "static";
const SERVER_ADDR = "http://localhost:1337";

export {
  VERSION,
  SITE_VERSION,
  SERVER_ADDR,
  LAST_UPDATED,
  DISCORD_INVITE_LINK,
  MODE,
};
