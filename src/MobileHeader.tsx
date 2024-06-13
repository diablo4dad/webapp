import { PropsWithChildren } from "react";
import styles from "./MobileHeader.module.css";

type Props = PropsWithChildren & {};

function MobileHeader({ children }: Props) {
  return <div className={styles.Block}>{children}</div>;
}

export default MobileHeader;
