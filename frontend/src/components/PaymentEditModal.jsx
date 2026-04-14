import React, { useMemo, useState } from "react";
import { currencyFormatter } from "../services/api";

export default function PaymentEditModal({
  student,
  loading,
  error,
  submitting,
  onClose,
  onSubmit,
}) {
  const [draftStudent, setDraftStudent] = useState(() => ({
    name: student?.name ?? "",
    admissionNo: student?.admissionNo ?? "",
    section: student?.section ?? "A",
    parentName: student?.parentName ?? "",
    parentContactNumber: student?.parentContactNumber ?? "",
  }));

  React.useEffect(() => {
    setDraftStudent({
      name: student?.name ?? "",
      admissionNo: student?.admissionNo ?? "",
      section: student?.section ?? "A",
      parentName: student?.parentName ?? "",
      parentContactNumber: student?.parentContactNumber ?? "",
    });
  }, [student]);

  const projectedTotals = useMemo(() => {
    const totalFee = student?.totalFee ?? 0;
    const projectedPaid = student?.totalPaid ?? 0;
    return {
      paid: projectedPaid,
      balance: Math.max(totalFee - projectedPaid, 0),
    };
  }, [student]);

  function updateField(key, value) {
    setDraftStudent((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(draftStudent);
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <section className="modal-card panel" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">Edit Student</p>
            <h2>{student?.name ?? "Student"} profile details</h2>
          </div>
          <button className="icon-button muted-button" type="button" onClick={onClose}>
            x
          </button>
        </div>

        {loading ? (
          <div className="inline-empty">
            <strong>Loading payment details</strong>
            <p>Fetching the latest data from the database.</p>
          </div>
        ) : error ? (
          <div className="form-error">{error}</div>
        ) : (
          <form className="payment-edit-form" onSubmit={handleSubmit}>
            <div className="overview-grid modal-overview">
              <article>
                <span>Total Fee</span>
                <strong>{currencyFormatter.format(student.totalFee)}</strong>
              </article>
              <article>
                <span>Projected Paid</span>
                <strong>{currencyFormatter.format(projectedTotals.paid)}</strong>
              </article>
              <article>
                <span>Projected Balance</span>
                <strong>{currencyFormatter.format(projectedTotals.balance)}</strong>
              </article>
            </div>

            <div className="student-form two-column-form">
              <label>
                <span>Student name</span>
                <input value={draftStudent.name} onChange={(event) => updateField("name", event.target.value)} required />
              </label>
              <label>
                <span>Admission number</span>
                <input
                  value={draftStudent.admissionNo}
                  onChange={(event) => updateField("admissionNo", event.target.value)}
                  required
                />
              </label>
              <label>
                <span>Section</span>
                <input value={draftStudent.section} onChange={(event) => updateField("section", event.target.value)} required />
              </label>
              <label>
                <span>Parent name</span>
                <input
                  value={draftStudent.parentName}
                  onChange={(event) => updateField("parentName", event.target.value)}
                  required
                />
              </label>
              <label>
                <span>Parent contact</span>
                <input
                  value={draftStudent.parentContactNumber}
                  onChange={(event) => updateField("parentContactNumber", event.target.value)}
                  required
                />
              </label>
            </div>

            <div className="form-note">
              Editing the student profile will not merge or remove installment records. Payment history remains visible as separate transactions for this student.
            </div>

            <div className="modal-actions">
              <button className="ghost-button" type="button" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button className="primary-button" type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save student changes"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
