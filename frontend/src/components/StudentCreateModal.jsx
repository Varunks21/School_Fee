import React, { useState } from "react";

const initialForm = {
  name: "",
  admissionNo: "",
  section: "A",
  parentName: "",
  parentContactNumber: "",
  paymentAmount: "",
  paymentMode: "Cash",
};

export default function StudentCreateModal({ className, onClose, onSubmit, submitting, error }) {
  const [form, setForm] = useState(initialForm);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(form);
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal-card panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">New Student</p>
            <h2>Add student to {className}</h2>
          </div>
          <button className="icon-button muted-button" type="button" onClick={onClose}>
            x
          </button>
        </div>

        <form className="student-form" onSubmit={handleSubmit}>
          <label>
            <span>Student name</span>
            <input value={form.name} onChange={(event) => updateField("name", event.target.value)} required />
          </label>

          <label>
            <span>Admission number</span>
            <input
              value={form.admissionNo}
              onChange={(event) => updateField("admissionNo", event.target.value)}
              required
            />
          </label>

          <label>
            <span>Section</span>
            <input value={form.section} onChange={(event) => updateField("section", event.target.value)} required />
          </label>

          <label>
            <span>Parent name</span>
            <input
              value={form.parentName}
              onChange={(event) => updateField("parentName", event.target.value)}
              required
            />
          </label>

          <label>
            <span>Parent contact</span>
            <input
              value={form.parentContactNumber}
              onChange={(event) => updateField("parentContactNumber", event.target.value)}
              required
            />
          </label>

          <label>
            <span>Initial payment amount</span>
            <input
              type="number"
              min="0"
              value={form.paymentAmount}
              onChange={(event) => updateField("paymentAmount", event.target.value)}
              placeholder="Optional"
            />
          </label>

          <label>
            <span>Payment mode</span>
            <select value={form.paymentMode} onChange={(event) => updateField("paymentMode", event.target.value)}>
              <option>Cash</option>
              <option>UPI</option>
              <option>Card</option>
              <option>Net Banking</option>
            </select>
          </label>

          <div className="form-note">
            Any payment entered here will be allocated automatically to fee components based on backend priority order.
          </div>

          {error ? <div className="form-error">{error}</div> : null}

          <div className="modal-actions">
            <button className="ghost-button" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? "Saving..." : "Create student"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
