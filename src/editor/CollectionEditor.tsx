import React, { ChangeEvent, FormEvent, useEffect, useState } from "react";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";
import { Collection } from "../data";
import { getDefaultItem } from "../data";
import { getItemName, getItemType } from "../data/getters";
import { hydrateDadDb } from "../data/factory";
import { useData } from "../data/context";
import { MasterGroup, catalogGroups } from "../common";
import {
  addCatalogCollectionNode,
  deleteCatalogCollectionNode,
  fetchHybridDadDbRef,
  updateCatalogCollectionNode,
} from "../store/catalog";
import { useEditor } from "./context";
import drawerStyles from "./CollectionItemEditor.module.css";
import styles from "./CollectionEditor.module.css";

type FormState = {
  description: string;
  name: string;
};

const initialForm: FormState = {
  description: "",
  name: "",
};

function createInitialForm(collection?: Collection): FormState {
  if (!collection) {
    return initialForm;
  }

  return {
    description: collection.description ?? "",
    name: collection.name,
  };
}

function hasChanges(initialState: FormState, form: FormState): boolean {
  return JSON.stringify(initialState) !== JSON.stringify(form);
}

function toCatalogGroup(category?: string): MasterGroup | undefined {
  return catalogGroups.find((catalogGroup) => catalogGroup === category);
}

function CollectionEditor() {
  const { setCatalogCategoryDb } = useData();
  const { activeCollectionEditor, closeCollectionEditor } = useEditor();
  const [form, setForm] = useState<FormState>(initialForm);
  const [initialState, setInitialState] = useState<FormState>(initialForm);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);

  const collection = activeCollectionEditor?.collection;
  const parentCollection = activeCollectionEditor?.parentCollection;
  const isEditingExisting = activeCollectionEditor?.mode === "edit";
  const editorHeading = isEditingExisting
    ? "Edit Collection"
    : parentCollection
      ? "Add Subcollection"
      : "Add Collection";
  const canSave = form.name.trim().length > 0;
  const canUndo = isEditingExisting && hasChanges(initialState, form);

  useEffect(() => {
    const nextInitialState = createInitialForm(collection);
    setInitialState(nextInitialState);
    setForm(nextInitialState);
    setError(undefined);
    setSaving(false);
    setDeleting(false);
    setDeleteModalOpen(false);
  }, [collection?.id]);

  function getActiveCatalogGroup(): MasterGroup {
    const targetGroup = toCatalogGroup(
      collection?.rootCategory ??
        parentCollection?.rootCategory ??
        activeCollectionEditor?.category ??
        collection?.category ??
        parentCollection?.category,
    );

    if (!targetGroup) {
      throw new Error("[Catalog] Unable to resolve collection category.");
    }

    return targetGroup;
  }

  async function refreshDb() {
    const targetGroup = getActiveCatalogGroup();
    const dadDbRef = await fetchHybridDadDbRef({
      category: targetGroup,
      source: "firestore",
    });

    setCatalogCategoryDb(targetGroup, hydrateDadDb(dadDbRef), "firestore");
  }

  function updateTextField(
    field: keyof FormState,
  ): (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void {
    return (event) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };
  }

  function undoChanges() {
    setForm(initialState);
    setError(undefined);
  }

  async function saveCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeCollectionEditor || !canSave) {
      return;
    }

    setSaving(true);
    setError(undefined);

    try {
      const name = form.name.trim();
      const description = form.description.trim();

      if (isEditingExisting && collection) {
        await updateCatalogCollectionNode(collection.id, {
          description,
          name,
        });
      } else {
        await addCatalogCollectionNode({
          category: activeCollectionEditor.category,
          collectionItems: [],
          description,
          name,
          parentId: parentCollection?.id ?? null,
        });
      }

      await refreshDb();
      closeCollectionEditor();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save collection.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCollection() {
    if (!collection) {
      return;
    }

    setDeleting(true);
    setError(undefined);

    try {
      await deleteCatalogCollectionNode(collection.id, getActiveCatalogGroup());
      await refreshDb();
      setDeleteModalOpen(false);
      closeCollectionEditor();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete collection.",
      );
    } finally {
      setDeleting(false);
    }
  }

  if (!activeCollectionEditor) {
    return null;
  }

  return (
    <div className={drawerStyles.Overlay} onClick={closeCollectionEditor}>
      <aside
        className={drawerStyles.Panel}
        onClick={(event) => event.stopPropagation()}
      >
        <form className={drawerStyles.Form} onSubmit={saveCollection}>
          <header className={drawerStyles.Header}>
            <div className={drawerStyles.HeaderText}>
              <div className={drawerStyles.Kicker}>{editorHeading}</div>
              <h2 className={drawerStyles.Title}>
                {parentCollection?.name ??
                  activeCollectionEditor.category ??
                  collection?.name ??
                  "Collection"}
              </h2>
            </div>
          </header>

          <div className={drawerStyles.Body}>
            <section className={drawerStyles.Section}>
              <label className={drawerStyles.Label} htmlFor="collection-name">
                Name
              </label>
              <input
                id="collection-name"
                className={drawerStyles.Input}
                value={form.name}
                onChange={updateTextField("name")}
                required
              />

              <label
                className={drawerStyles.Label}
                htmlFor="collection-description"
              >
                Description
              </label>
              <textarea
                id="collection-description"
                className={drawerStyles.TextArea}
                value={form.description}
                onChange={updateTextField("description")}
                rows={3}
              />
            </section>

            {isEditingExisting && collection && (
              <>
                <section className={drawerStyles.Section}>
                  <h3 className={styles.ListHeading}>Subcollections</h3>
                  <div className={styles.ReadOnlyList}>
                    {collection.subcollections.length === 0 && (
                      <div className={styles.EmptyListItem}>None</div>
                    )}
                    {collection.subcollections.map((subcollection) => (
                      <div key={subcollection.id} className={styles.ListItem}>
                        <div className={styles.ListItemName}>
                          {subcollection.name}
                        </div>
                        <div className={styles.ListItemDescription}>
                          {subcollection.description || "No description"}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className={drawerStyles.Section}>
                  <h3 className={styles.ListHeading}>Collection Items</h3>
                  <div className={styles.ReadOnlyList}>
                    {collection.collectionItems.length === 0 && (
                      <div className={styles.EmptyListItem}>None</div>
                    )}
                    {collection.collectionItems.map((collectionItem) => {
                      const item = getDefaultItem(collectionItem);

                      return (
                        <div
                          key={collectionItem.id}
                          className={styles.ListItem}
                        >
                          <div className={styles.ListItemName}>
                            {getItemName(collectionItem, item)}
                          </div>
                          <div className={styles.ListItemDescription}>
                            {getItemType(collectionItem, item)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </>
            )}
          </div>

          <footer className={drawerStyles.Actions}>
            <div className={drawerStyles.ActionLeft}>
              {isEditingExisting && collection && (
                <button
                  type="button"
                  className={drawerStyles.DeleteButton}
                  onClick={() => setDeleteModalOpen(true)}
                  disabled={saving || deleting}
                >
                  Delete
                </button>
              )}
            </div>
            <div className={drawerStyles.ActionRight}>
              {error && <div className={drawerStyles.Error}>{error}</div>}
              {isEditingExisting && (
                <button
                  type="button"
                  className={drawerStyles.SecondaryButton}
                  onClick={undoChanges}
                  disabled={!canUndo || saving || deleting}
                >
                  Undo
                </button>
              )}
              <button
                type="button"
                className={drawerStyles.SecondaryButton}
                onClick={closeCollectionEditor}
              >
                Close
              </button>
              <button
                type="submit"
                className={drawerStyles.SaveButton}
                disabled={!canSave || saving || deleting}
              >
                {saving ? "Saving" : "Save"}
              </button>
            </div>
          </footer>
        </form>
      </aside>
      {isDeleteModalOpen && collection && (
        <DeleteConfirmationModal
          title="Delete collection"
          description={`This will permanently remove this collection${
            collection.subcollections.length > 0
              ? " and its subcollections"
              : ""
          } from the catalogue.`}
          subject={`${collection.name} (${collection.collectionItems.length} items, ${collection.subcollections.length} subcollections)`}
          isDeleting={deleting}
          onCancel={() => setDeleteModalOpen(false)}
          onConfirm={deleteCollection}
        />
      )}
    </div>
  );
}

export default CollectionEditor;
