import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "../auth/context";

type EditorContextType = {
  canEditCatalog: boolean;
  isEditMode: boolean;
  setEditMode: (enabled: boolean) => void;
  toggleEditMode: () => void;
};

const defaultContext: EditorContextType = {
  canEditCatalog: false,
  isEditMode: false,
  setEditMode: () => undefined,
  toggleEditMode: () => undefined,
};

const EditorContext = createContext<EditorContextType>(defaultContext);

export function useEditor() {
  return useContext(EditorContext);
}

export function EditorProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [isEditMode, setEditMode] = useState(false);
  const canEditCatalog = user?.isEditor === true;

  useEffect(() => {
    if (!canEditCatalog) {
      setEditMode(false);
    }
  }, [canEditCatalog]);

  const contextValue = useMemo(
    () => ({
      canEditCatalog,
      isEditMode: canEditCatalog && isEditMode,
      setEditMode: (enabled: boolean) => setEditMode(canEditCatalog && enabled),
      toggleEditMode: () =>
        setEditMode((enabled) => !enabled && canEditCatalog),
    }),
    [canEditCatalog, isEditMode],
  );

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  );
}
