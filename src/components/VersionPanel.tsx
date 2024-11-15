import React, { ReactElement } from "react";
import styles from "../routes/Root.module.css";
import { LAST_UPDATED, SITE_VERSION } from "../config";

export function VersionInfo(): ReactElement<HTMLDivElement> {
  return (
    <div className={styles.SiteVersion}>
      <div>Last updated {LAST_UPDATED}</div>
      <div>
        Site Version <code>{SITE_VERSION}</code>
      </div>
    </div>
  );
}
