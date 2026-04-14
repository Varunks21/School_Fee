import React, { useEffect, useRef, useState } from "react";
import {
  createClass,
  createFeeComponent,
  currencyFormatter,
  fetchClassFeeStructure,
  fetchFeeComponents,
  saveClassFeeStructure,
} from "../services/api";

const DEFAULT_CLASS_TEMPLATE = [
  { name: "Tuition", amount: 2500, priority: 1 },
  { name: "Transport", amount: 1200, priority: 2 },
  { name: "Library", amount: 400, priority: 3 },
  { name: "Sports", amount: 600, priority: 4 },
];
const NEW_CLASS_OPTION = "__new_class__";

const emptyRow = () => ({
  id: `draft-${Math.random().toString(36).slice(2, 10)}`,
  componentId: "",
  amount: "",
  priority: "",
});

function normalizeComponentName(value) {
  return value.trim().toLowerCase();
}

async function ensureTemplateComponents(componentList) {
  const nextComponents = [...componentList];

  for (const templateItem of DEFAULT_CLASS_TEMPLATE) {
    const exists = nextComponents.some(
      (component) => normalizeComponentName(component.name) === normalizeComponentName(templateItem.name)
    );

    if (!exists) {
      const createdComponent = await createFeeComponent({ name: templateItem.name });
      nextComponents.push(createdComponent);
    }
  }

  return nextComponents.sort((left, right) => left.name.localeCompare(right.name));
}

function buildTemplateRows(componentList) {
  return DEFAULT_CLASS_TEMPLATE.map((templateItem) => {
    const matchedComponent = componentList.find(
      (component) => normalizeComponentName(component.name) === normalizeComponentName(templateItem.name)
    );

    return {
      id: `template-${normalizeComponentName(templateItem.name)}`,
      componentId: matchedComponent ? String(matchedComponent.id) : "",
      amount: String(templateItem.amount),
      priority: String(templateItem.priority),
    };
  });
}

export default function FeeConfigModal({ classes, selectedClassId, intent, onClose, onSaved }) {
  const [activeClassId, setActiveClassId] = useState(selectedClassId ?? classes[0]?.id ?? "");
  const [components, setComponents] = useState([]);
  const [rows, setRows] = useState([emptyRow()]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [componentName, setComponentName] = useState("");
  const [componentSubmitting, setComponentSubmitting] = useState(false);
  const [componentError, setComponentError] = useState("");
  const [className, setClassName] = useState("");
  const [classSubmitting, setClassSubmitting] = useState(false);
  const [classError, setClassError] = useState("");
  const classInputRef = useRef(null);

  const isAddClassIntent = intent === "add-class";
  const isCreatingNewClass = isAddClassIntent && activeClassId === NEW_CLASS_OPTION;
  const selectedClass = classes.find((item) => item.id === activeClassId) ?? null;

  useEffect(() => {
    if (isAddClassIntent) {
      setActiveClassId(selectedClassId || NEW_CLASS_OPTION);
      return;
    }

    setActiveClassId(selectedClassId || classes[0]?.id || "");
  }, [selectedClassId, classes, isAddClassIntent]);

  useEffect(() => {
    let active = true;

    async function loadModalData() {
      if (!activeClassId || activeClassId === NEW_CLASS_OPTION) {
        try {
          const componentList = await fetchFeeComponents();
          const preparedComponents = await ensureTemplateComponents(componentList);
          if (!active) {
            return;
          }
          setComponents(preparedComponents);
          setRows(buildTemplateRows(preparedComponents));
        } catch {
          if (!active) {
            return;
          }
          setComponents([]);
          setRows(buildTemplateRows([]));
        }
        setError("");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const [componentList, structure] = await Promise.all([
          fetchFeeComponents(),
          fetchClassFeeStructure(activeClassId),
        ]);
        const preparedComponents = await ensureTemplateComponents(componentList);
        if (!active) {
          return;
        }
        setComponents(preparedComponents);
        setRows(
          structure.length
            ? structure.map((item) => ({
                id: item.id,
                componentId: item.componentId,
                amount: String(item.amount),
                priority: String(item.priority),
              }))
            : buildTemplateRows(preparedComponents)
        );
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError.message || "Unable to load fee setup");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadModalData();

    return () => {
      active = false;
    };
  }, [activeClassId]);

  useEffect(() => {
    if (isCreatingNewClass) {
      setTimeout(() => {
        classInputRef.current?.focus();
      }, 0);
    }
  }, [isCreatingNewClass]);

  function updateRow(rowId, key, value) {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)));
  }

  function addRow() {
    setRows((current) => [...current, emptyRow()]);
  }

  function removeRow(rowId) {
    setRows((current) => {
      const next = current.filter((row) => row.id !== rowId);
      return next.length ? next : [emptyRow()];
    });
  }

  async function handleCreateComponent(event) {
    event.preventDefault();
    if (!componentName.trim()) {
      return;
    }

    try {
      setComponentSubmitting(true);
      setComponentError("");
      const component = await createFeeComponent({ name: componentName.trim() });
      setComponents((current) => [...current, component].sort((left, right) => left.name.localeCompare(right.name)));
      setComponentName("");
    } catch (submitError) {
      setComponentError(submitError.message || "Unable to create fee component");
    } finally {
      setComponentSubmitting(false);
    }
  }

  async function handleSave(event) {
    event.preventDefault();

    const normalizedRows = rows
      .filter((row) => row.componentId && row.amount !== "" && row.priority !== "")
      .map((row) => ({
        componentId: row.componentId,
        amount: Number(row.amount),
        priority: Number(row.priority),
      }));

    if (!normalizedRows.length) {
      setError("Add at least one component with amount and priority");
      return;
    }

    const componentIds = normalizedRows.map((row) => row.componentId);
    const priorities = normalizedRows.map((row) => row.priority);

    if (new Set(componentIds).size !== componentIds.length) {
      setError("Each fee component should appear only once per standard");
      return;
    }

    if (new Set(priorities).size !== priorities.length) {
      setError("Priority values must be unique so installment allocation stays deterministic");
      return;
    }

    if (normalizedRows.some((row) => row.amount < 0 || row.priority < 1)) {
      setError("Amounts must be zero or more, and priorities must start from 1");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setClassError("");
      let classIdToSave = activeClassId;

      if (activeClassId === NEW_CLASS_OPTION) {
        if (!className.trim()) {
          setError("Enter the new class name before saving");
          return;
        }

        setClassSubmitting(true);
        const newClass = await createClass({ name: className.trim() });
        classIdToSave = String(newClass.id);
        setActiveClassId(classIdToSave);
      }

      await saveClassFeeStructure({
        classId: classIdToSave,
        fees: normalizedRows,
      });
      await onSaved(classIdToSave);
      setClassName("");
      onClose();
    } catch (saveError) {
      const message = saveError.message || "Unable to save fee structure";
      if (activeClassId === NEW_CLASS_OPTION) {
        setClassError(message);
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
      setClassSubmitting(false);
    }
  }

  const totalConfigured = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal-card panel fee-config-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Fee Setup</p>
            <h2>{isAddClassIntent ? "Create a class with a starter fee template" : "Edit fee setup for an existing class"}</h2>
          </div>
          <button className="icon-button muted-button" type="button" onClick={onClose}>
            x
          </button>
        </div>

        <div className="fee-config-toolbar">
          <label className="search-field">
            <span>{isAddClassIntent ? "Selected class" : "Choose class to edit"}</span>
            <select value={activeClassId} onChange={(event) => setActiveClassId(event.target.value)}>
              {isAddClassIntent ? <option value={NEW_CLASS_OPTION}>New class</option> : null}
              {classes.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </label>

          {isCreatingNewClass ? (
            <div className="toolbar-class-creator">
              <label className="search-field">
                <span>New class name</span>
                <input
                  ref={classInputRef}
                  value={className}
                  onChange={(event) => setClassName(event.target.value)}
                  placeholder="Example: Class 6, Grade 10, UKG"
                />
              </label>
            </div>
          ) : null}

          <div className="fee-config-summary">
            <span>Configured total</span>
            <strong>{currencyFormatter.format(totalConfigured)}</strong>
            <small>{selectedClass ? `${selectedClass.studentCount} students in this standard` : "No class selected"}</small>
          </div>
        </div>

        {isAddClassIntent ? (
          classError ? <div className="form-error">{classError}</div> : null
        ) : (
          <div className="form-note">
            Select a previously added class above, then update its components, change amounts, or remove rows before saving.
          </div>
        )}

        {!isAddClassIntent ? (
          <>
            <form className="component-creator" onSubmit={handleCreateComponent}>
              <label>
                <span>Create fee component</span>
                <input
                  value={componentName}
                  onChange={(event) => setComponentName(event.target.value)}
                  placeholder="Example: Tuition, Transport, Exam Fee"
                />
              </label>
              <button className="ghost-button" type="submit" disabled={componentSubmitting}>
                {componentSubmitting ? "Creating..." : "Add component"}
              </button>
            </form>
            {componentError ? <div className="form-error">{componentError}</div> : null}
          </>
        ) : null}

        {loading ? (
          <div className="inline-empty">
            <strong>Loading fee structure</strong>
            <p>Fetching configured components and priorities for this standard.</p>
          </div>
        ) : (
          <form className="payment-edit-form" onSubmit={handleSave}>
            <div className="fee-structure-table">
              <div className="fee-structure-head">
                <span>Component</span>
                <span>Amount</span>
                <span>Priority</span>
                <span>Action</span>
              </div>
              <div className="fee-structure-body">
                {rows.map((row) => (
                  <div className="fee-structure-row" key={row.id}>
                    <label>
                      <select
                        value={row.componentId}
                        onChange={(event) => updateRow(row.id, "componentId", event.target.value)}
                        required
                        disabled={!activeClassId}
                      >
                        <option value="">Select component</option>
                        {components.map((component) => (
                          <option key={component.id} value={component.id}>
                            {component.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <input
                        type="number"
                        min="0"
                        value={row.amount}
                        onChange={(event) => updateRow(row.id, "amount", event.target.value)}
                        placeholder="0"
                        required
                        disabled={!activeClassId}
                      />
                    </label>
                    <label>
                      <input
                        type="number"
                        min="1"
                        value={row.priority}
                        onChange={(event) => updateRow(row.id, "priority", event.target.value)}
                        placeholder="1"
                        required
                        disabled={!activeClassId}
                      />
                    </label>
                    <button
                      className="ghost-button danger-button"
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={!activeClassId}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="fee-config-actions">
              <button
                className="ghost-button"
                type="button"
                onClick={addRow}
                disabled={!activeClassId}
              >
                Add row
              </button>
              <div className="form-note">
                Lower priority number means the installment gets allocated there first. Example: `1` before `2`.
              </div>
            </div>

            {error ? <div className="form-error">{error}</div> : null}

            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={onClose} disabled={saving}>
                Cancel
              </button>
              <button className="primary-button" type="submit" disabled={saving || classSubmitting}>
                {saving || classSubmitting
                  ? "Saving..."
                  : isCreatingNewClass
                    ? "Create class and save"
                    : "Save fee structure"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
