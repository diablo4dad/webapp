import {
  DATABASE_VERSION,
  LAST_UPDATED,
  SITE_VERSION,
  VERSION,
} from "./build-info.generated";

const DISCORD_INVITE_LINK = "https://discord.gg/mPRBrU2kYT";
const DATA_REPO =
  "https://raw.githubusercontent.com/DiabloTools/d4data/master/json";
const FIREBASE_PROJECT_ID = "d4log-bfc60";
const FIREBASE_STORAGE_BUCKET = `${FIREBASE_PROJECT_ID}.appspot.com`;
const ICON_BUCKET =
  `https://firebasestorage.googleapis.com/v0/b/${FIREBASE_STORAGE_BUCKET}/o`;

export {
  DATABASE_VERSION,
  VERSION,
  SITE_VERSION,
  LAST_UPDATED,
  DISCORD_INVITE_LINK,
  DATA_REPO,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  ICON_BUCKET,
};
