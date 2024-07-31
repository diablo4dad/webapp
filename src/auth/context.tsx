import {createContext, PropsWithChildren, useContext, useEffect, useMemo, useState} from "react";
import {GoogleAuthProvider, signInWithPopup, User} from "firebase/auth";
import {auth} from "../config/firebase";
import {DadUser} from "./type";

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

function userToDadUser(user: User): DadUser {
  return {
    uid: user.uid,
    providerId: user.providerId,
    email: user.email ?? "unknown@traveller",
    registered: user.metadata.creationTime,
  };
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<DadUser>();

  // auth effect
  useEffect(() => {
    console.log("[Auth] Authenticating...");

    // add user state listener
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log("[Auth] State changed.", { ...user });
      setUser(user ? userToDadUser(user) : undefined);
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
