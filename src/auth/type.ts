const EDITOR_ROLE = "EDITOR";

export type DadUser = {
  uid: string,
  email: string,
  providerId: string,
  registered?: string,
  roles: string[],
  isEditor: boolean,
}

export { EDITOR_ROLE };
