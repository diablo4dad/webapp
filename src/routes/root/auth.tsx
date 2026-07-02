import Account, { Direction } from "../../auth/Account";
import Authenticate, { Orientation } from "../../auth/Authenticate";
import type { DadUser } from "../../auth/type";

type Props = {
  onSignIn: () => void;
  onSignOut: () => void;
  user?: DadUser;
};

function AuthActions({
  onSignIn,
  onSignOut,
  user,
}: Props) {
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

export { AuthActions };
