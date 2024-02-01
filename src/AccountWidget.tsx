import styles from "./AccountWidget.module.css";
import Button, {BtnColours} from "./Button";
import {BattleNet, Discord} from "./Icons";
import React from "react";

function AccountWidget() {
    return (
        <div className={styles.Account}>
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

export default AccountWidget
