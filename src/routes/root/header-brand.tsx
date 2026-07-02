import i18n from "../../i18n";
import logo from "../../image/d4dad-badge@1x.png";
import styles from "./header-brand.module.css";

function RootHeaderLogo() {
  return (
    <img
      className={styles.HeaderBrandLogo}
      src={logo}
      alt={i18n.gameName}
    />
  );
}

function RootHeaderTitle() {
  return (
    <div className={styles.HeaderBrandTitle}>
      <div className={styles.HeaderBrandTitleName}>
        <span className={styles.HeaderBrandTitleNameAccent}>Diablo IV</span>{" "}
        <span>Dad</span>
      </div>
      <div className={styles.HeaderBrandTitleTagLine}>
        {i18n.siteTagLine}
      </div>
    </div>
  );
}

export { RootHeaderLogo, RootHeaderTitle };
