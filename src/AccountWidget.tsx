import styles from "./AccountWidget.module.css";
import Button, {BtnColours} from "./Button";
import {BattleNet, Discord} from "./Icons";
import React from "react";
import {exec} from "node:child_process";

enum Orientation {
    COLUMN,
    ROW,
}

type Props = {
    orientation?: Orientation
}

function AccountWidget({ orientation = Orientation.COLUMN }: Props) {
    function getClasses() {
        return [
            styles.Account,
            orientation === Orientation.ROW ? styles.AccountRow : null,
        ].filter(c => c !== null).join(' ');
    }
    return (
        <div className={getClasses()}>
            <div className={styles.AccountText}>
                <div>You are not authenticated</div>
                <div>Login to backup your progress</div>
            </div>
            <div className={styles.AccountIcons}>
                <Button colour={BtnColours.Discord}>
                    <Discord/>
                </Button>
                <Button colour={BtnColours.BattleNet}>
                    <BattleNet/>
                </Button>
            </div>
        </div>
    )
}

export {Orientation}
export default AccountWidget
