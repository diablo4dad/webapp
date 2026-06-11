import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { GoogleAuthProvider, User, signInWithPopup } from "firebase/auth";
import {auth} from "../config/firebase";
import { DadUser, EDITOR_ROLE } from "./type";

type AuthType = {
  user?: DadUser;
  signIn: () => void,
  signOut: () => void,
}

const defaultAuth: AuthType = {
  signIn: () => undefined,
  signOut: () => undefined,
}

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthContext =
  createContext<AuthType>(defaultAuth);

function signIn() {
  const provider = new GoogleAuthProvider();

  signInWithPopup(auth, provider)
    .then((result) => {
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential) {
        const user = result.user;
        console.log("[Auth] Logged in.", { ...user });
      } else {
        console.error("[Auth] Signed in but Credential was null.");
      }
    })
    .catch((error) => {
      console.log("[Auth] Error signing in.", error);
    });
}

function signOut() {
  auth.signOut().then(() => {
    console.log("[Auth] Signed out.");
  });
}

function getUserRoles(user: User): Promise<string[]> {
  return user.getIdTokenResult().then((tokenResult) => {
    const roles = new Set<string>();

    if (typeof tokenResult.claims.role === "string") {
      roles.add(tokenResult.claims.role);
    }

    if (Array.isArray(tokenResult.claims.roles)) {
      tokenResult.claims.roles
        .filter((role): role is string => typeof role === "string")
        .forEach((role) => roles.add(role));
    }

    if (tokenResult.claims.editor === true) {
      roles.add(EDITOR_ROLE);
    }

    return Array.from(roles.values());
  });
}

async function userToDadUser(user: User): Promise<DadUser> {
  const roles = await getUserRoles(user);

  return {
    uid: user.uid,
    providerId: user.providerId,
    email: user.email ?? "unknown@traveller",
    registered: user.metadata.creationTime,
    roles,
    isEditor: roles.includes(EDITOR_ROLE),
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<DadUser>();

  // auth effect
  useEffect(() => {
    console.log("[Auth] Authenticating...");

    // add user state listener
    const unsubscribe = auth.onIdTokenChanged(async (user) => {
      console.log("[Auth] State changed.", { ...user });

      if (user === null) {
        setUser(undefined);
        return;
      }

      const dadUser = await userToDadUser(user);
      setUser(dadUser);
    });

    return () => {
      console.log("[Auth] Unsubscribing...");
      unsubscribe();
    };
  }, []);

  const contextValue = useMemo(() => ({user, signIn, signOut}), [user]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
