const SERVER_ADDR =
  process.env.NODE_ENV === "production"
    ? "https://db.diablo4.dad"
    : "http://localhost:1337";
// const SERVER_ADDR = 'https://db.diablo4.dad';
const SITE_VERSION = "1.6.7";
const VERSION = { major: 1, minor: 6, revision: 7 };
const LAST_UPDATED = "June 14th, 2024";
const DISCORD_INVITE_LINK = "https://discord.gg/mPRBrU2kYT";
const MODE = process.env.NODE_ENV === "production" ? "static" : "live";

export {
  VERSION,
  SITE_VERSION,
  SERVER_ADDR,
  LAST_UPDATED,
  DISCORD_INVITE_LINK,
  MODE,
};
