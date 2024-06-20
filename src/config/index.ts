const VERSION = { major: 1, minor: 6, revision: 9 };
const SITE_VERSION = `${VERSION.major}.${VERSION.minor}.${VERSION.revision}`;
const LAST_UPDATED = "June 14th, 2024";
const DISCORD_INVITE_LINK = "https://discord.gg/mPRBrU2kYT";
const MODE = process.env.NODE_ENV === "production" ? "static" : "live";
const SERVER_ADDR = "http://localhost:1337";

export {
  VERSION,
  SITE_VERSION,
  SERVER_ADDR,
  LAST_UPDATED,
  DISCORD_INVITE_LINK,
  MODE,
};
