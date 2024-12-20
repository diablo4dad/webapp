import {
  createContext,
  Dispatch,
  JSX,
  PropsWithChildren,
  useReducer,
} from "react";

const defaultContext: SidebarState = {
  open: false,
  sidebar: null,
};

const defaultAction = () => defaultContext;

export const SidebarContext = createContext<SidebarState>(defaultContext);
export const SidebarDispatchContext =
  createContext<Dispatch<SidebarAction>>(defaultAction);

export enum SidebarActionType {
  OPEN_SIDEBAR,
  CLOSE_SIDEBAR,
  SET_SIDEBAR,
}

export type SidebarAction = {
  type: SidebarActionType;
  sidebar: JSX.Element | null;
};

export type SidebarState = {
  sidebar: JSX.Element | null;
  open: boolean;
};

export function SidebarProvider({ children }: PropsWithChildren) {
  const [state, dispatch] = useReducer(sidebarReducer, defaultContext);

  return (
    <SidebarContext.Provider value={state}>
      <SidebarDispatchContext.Provider value={dispatch}>
        {children}
      </SidebarDispatchContext.Provider>
    </SidebarContext.Provider>
  );
}

function sidebarReducer(
  state: SidebarState,
  action: SidebarAction,
): SidebarState {
  switch (action.type) {
    case SidebarActionType.CLOSE_SIDEBAR:
      return {
        ...state,
        open: false,
      };
    case SidebarActionType.OPEN_SIDEBAR:
      return {
        sidebar: action.sidebar ?? state.sidebar,
        open: true,
      };
    case SidebarActionType.SET_SIDEBAR:
      return {
        ...state,
        sidebar: action.sidebar,
      };
  }
}
