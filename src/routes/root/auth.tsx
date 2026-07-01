import Account, { Direction } from "../../auth/Account";
import Authenticate, { Orientation } from "../../auth/Authenticate";
import type { DadUser } from "../../auth/type";

type RootAuthActionsProps = {
  onSignIn: () => void;
  onSignOut: () => void;
  user?: DadUser;
};

function RootAuthActions({
  onSignIn,
  onSignOut,
  user,
}: RootAuthActionsProps) {
  if (user === undefined) {
    return <Authenticate orientation={Orientation.ROW} onAuth={onSignIn} />;
  }

  return (
    <Account
      currentUser={user}
      onLogout={onSignOut}
      direction={Direction.ROW}
    />
  );
}

export { RootAuthActions };
