import React from "react";
import { currencyFormatter } from "../services/api";

export default function PaymentForm({
  student,
  overview,
  payments,
  paymentDraft,
  onPaymentDraftChange,
  onPaymentSubmit,
  paymentSubmitting,
  paymentError,
}) {
  if (!student || !overview) {
    return null;
  }

  return (
    <section className="payment-preview panel">
      <div className="preview-hero">
        <div>
          <p className="eyebrow">Student Preview</p>
          <h2>{student.name}</h2>
          <p className="hero-copy">
            {student.parentName} | {student.parentContactNumber} | Admission No {student.admissionNo}
          </p>
        </div>
        <div className="hero-tag">{student.totalBalance === 0 ? "All dues cleared" : "Pending balance"}</div>
      </div>

      <div className="overview-grid">
        <article>
          <span>Total Fee</span>
          <strong>{overview.totalFee}</strong>
        </article>
        <article>
          <span>Paid So Far</span>
          <strong>{overview.paid}</strong>
        </article>
        <article>
          <span>Outstanding</span>
          <strong>{overview.due}</strong>
        </article>
      </div>

      <div className="preview-layout">
        <section className="fee-breakdown card-section">
          <div className="section-heading">
            <h3>Fee details</h3>
            <span>{student.academicYear}</span>
          </div>
          <div className="line-items">
            {student.feeBreakdown.map((item) => (
              <div className="line-item" key={item.label}>
                <div>
                  <strong>{item.label}</strong>
                  <p>
                    {item.status} | Paid {currencyFormatter.format(item.paidAmount)}
                  </p>
                </div>
                <span>{currencyFormatter.format(item.amount)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="payment-history card-section">
          <div className="section-heading">
            <h3>Installment history</h3>
            <span>{payments.length} transactions</span>
          </div>
          <form className="installment-form" onSubmit={onPaymentSubmit}>
            <label>
              <span>Add new installment</span>
              <input
                type="number"
                min="1"
                value={paymentDraft.amount}
                onChange={(event) => onPaymentDraftChange("amount", event.target.value)}
                placeholder="Enter amount"
                required
              />
            </label>
            <label>
              <span>Mode</span>
              <select
                value={paymentDraft.paymentMode}
                onChange={(event) => onPaymentDraftChange("paymentMode", event.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </label>
            <button className="primary-button" type="submit" disabled={paymentSubmitting}>
              {paymentSubmitting ? "Saving..." : "Add installment"}
            </button>
          </form>
          {paymentError ? <div className="form-error">{paymentError}</div> : null}
          <div className="history-list">
            {payments.length ? (
              payments.map((payment, index) => (
                <article className="history-row" key={payment.id}>
                  <div>
                    <strong>{currencyFormatter.format(payment.amount)}</strong>
                    <p>
                      Installment {payments.length - index} | {payment.mode} | {payment.reference}
                    </p>
                  </div>
                  <time>{payment.date}</time>
                </article>
              ))
            ) : (
              <div className="inline-empty">
                <strong>No installments recorded</strong>
                <p>The student profile is available, but no payment transactions have been added yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}
