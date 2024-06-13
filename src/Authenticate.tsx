import styles from "./Authenticate.module.css";
import Button from "./Button";
import { Google } from "./Icons";
import React from "react";

enum AuthGiant {
  GOOGLE,
  DISCORD,
  BATTLE_NET,
}

enum Orientation {
  COLUMN,
  ROW,
}

type Props = {
  orientation?: Orientation;
  onAuth: (auth: AuthGiant) => void;
};

function Authenticate({ orientation = Orientation.COLUMN, onAuth }: Props) {
  function getClasses() {
    return [
      styles.Account,
      orientation === Orientation.ROW ? styles.AccountRow : null,
    ]
      .filter((c) => c !== null)
      .join(" ");
  }

  return (
    <div className={getClasses()}>
      <div className={styles.AccountText}>
        <div>You are not authenticated</div>
        <div
          className={styles.AccountLoginText}
          onClick={() => onAuth(AuthGiant.GOOGLE)}
        >
          Login to save your progress
        </div>
      </div>
      <div className={styles.AccountIcons}>
        <Button onClick={() => onAuth(AuthGiant.GOOGLE)}>
          <Google />
        </Button>
        {/*<Button colour={BtnColours.Discord} onClick={() => onAuth(AuthGiant.DISCORD)}>*/}
        {/*    <Discord/>*/}
        {/*</Button>*/}
        {/*<Button colour={BtnColours.BattleNet} onClick={() => onAuth(AuthGiant.BATTLE_NET)}>*/}
        {/*    <BattleNet/>*/}
        {/*</Button>*/}
      </div>
    </div>
  );
}

export { Orientation, AuthGiant };
export default Authenticate;
