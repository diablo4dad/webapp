import type { DadUser } from "../../services/auth";
import {
  Account,
  Authenticate,
  Direction,
  Orientation,
} from "../../features/account/ui";

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
