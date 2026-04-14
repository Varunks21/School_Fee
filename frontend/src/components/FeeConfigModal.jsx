import React, { useEffect, useState } from "react";
import {
  createClass,
  createFeeComponent,
  currencyFormatter,
  fetchClassFeeStructure,
  fetchFeeComponents,
  saveClassFeeStructure,
} from "../services/api";

const emptyRow = () => ({
  id: `draft-${Math.random().toString(36).slice(2, 10)}`,
  componentId: "",
  amount: "",
  priority: "",
});

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
  const classInputRef = useState(null)[0];

  const selectedClass = classes.find((item) => item.id === activeClassId) ?? null;

  useEffect(() => {
    let active = true;

    async function loadModalData() {
      try {
        setLoading(true);
        setError("");
        const [componentList, structure] = await Promise.all([
          fetchFeeComponents(),
          fetchClassFeeStructure(activeClassId),
        ]);
        if (!active) {
          return;
        }
        setComponents(componentList);
        setRows(
          structure.length
            ? structure.map((item) => ({
                id: item.id,
                componentId: item.componentId,
                amount: String(item.amount),
                priority: String(item.priority),
              }))
            : [emptyRow()]
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

    if (activeClassId) {
      loadModalData();
    }

    return () => {
      active = false;
    };
  }, [activeClassId]);

  useEffect(() => {
    if (intent === "add-class") {
      setTimeout(() => {
        classInputRef?.focus?.();
      }, 0);
    }
  }, [intent, classInputRef]);

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

  async function handleCreateClass(event) {
    event.preventDefault();
    if (!className.trim()) {
      return;
    }

    try {
      setClassSubmitting(true);
      setClassError("");
      const newClass = await createClass({ name: className.trim() });
      const refreshedClasses = await onSaved(newClass.id);
      setActiveClassId(
        refreshedClasses?.some((item) => String(item.id) === String(newClass.id))
          ? String(newClass.id)
          : String(newClass.id)
      );
      setClassName("");
    } catch (submitError) {
      setClassError(submitError.message || "Unable to create class");
    } finally {
      setClassSubmitting(false);
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
      await saveClassFeeStructure({
        classId: activeClassId,
        fees: normalizedRows,
      });
      await onSaved(activeClassId);
      onClose();
    } catch (saveError) {
      setError(saveError.message || "Unable to save fee structure");
    } finally {
      setSaving(false);
    }
  }

  const totalConfigured = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal-card panel fee-config-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Fee Setup</p>
            <h2>Configure components for each standard</h2>
          </div>
          <button className="icon-button muted-button" type="button" onClick={onClose}>
            x
          </button>
        </div>

        <div className="fee-config-toolbar">
          <label className="search-field">
            <span>Standard / Class</span>
            <select value={activeClassId} onChange={(event) => setActiveClassId(event.target.value)}>
              {classes.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.name}
                </option>
              ))}
            </select>
          </label>

          <div className="fee-config-summary">
            <span>Configured total</span>
            <strong>{currencyFormatter.format(totalConfigured)}</strong>
            <small>{selectedClass ? `${selectedClass.studentCount} students in this standard` : "No class selected"}</small>
          </div>
        </div>

        <form className="component-creator" onSubmit={handleCreateClass}>
          <label>
            <span>Add new class / standard</span>
            <input
              ref={(node) => {
                if (node) {
                  classInputRef.focus = () => node.focus();
                }
              }}
              value={className}
              onChange={(event) => setClassName(event.target.value)}
              placeholder="Example: Class 6, Grade 10, UKG"
            />
          </label>
          <button className="ghost-button" type="submit" disabled={classSubmitting}>
            {classSubmitting ? "Creating..." : "Add class"}
          </button>
        </form>
        {classError ? <div className="form-error">{classError}</div> : null}

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
                      />
                    </label>
                    <button className="ghost-button danger-button" type="button" onClick={() => removeRow(row.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="fee-config-actions">
              <button className="ghost-button" type="button" onClick={addRow}>
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
              <button className="primary-button" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save fee structure"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
