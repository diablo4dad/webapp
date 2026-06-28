const EDITOR_ROLE = "EDITOR";

type AccountProvider = {
  id: string | null,
  username: string | null,
  displayName: string | null,
  email: string | null,
  avatarUrl: string | null,
}

export type AccountProfile = {
  uid: string,
  username: string | null,
  linkedProviders: string[],
  providers: {
    discord: AccountProvider | null,
    google: AccountProvider | null,
  },
  mergedInto: string | null,
}

export type DadUser = {
  uid: string,
  email: string,
  providerId: string,
  registered?: string,
  roles: string[],
  isEditor: boolean,
}

export { EDITOR_ROLE };
