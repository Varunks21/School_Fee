import React from "react";
import { getClassFeePreview } from "../services/api";

export default function FeeTable({ rows, onSelectClass, onConfigureFees, onAddClass }) {
  const hasClasses = rows.length > 0;

  return (
    <section className="panel table-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Class Ledger</p>
          <h2>Fee collection by class</h2>
        </div>
        <div className="header-actions">
          <button className="ghost-button" type="button" onClick={onAddClass}>
            Add class
          </button>
          <button
            className="primary-button table-button"
            type="button"
            onClick={() => onConfigureFees(rows[0]?.id ?? null)}
            disabled={!hasClasses}
          >
            Configure fees
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>Teacher</th>
              <th>Students</th>
              <th>Fee Setup</th>
              <th>Collected</th>
              <th>Outstanding</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {hasClasses ? (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <div className="class-cell">
                      <strong>{row.name}</strong>
                      <span>{row.section === "-" ? "Section not assigned" : `Section ${row.section}`}</span>
                    </div>
                  </td>
                  <td>{row.teacher}</td>
                  <td>{row.studentCount}</td>
                  <td>{getClassFeePreview(row)}</td>
                  <td>{row.totalPaid}</td>
                  <td>{row.totalDue}</td>
                  <td>
                    <span className={`status-pill status-${row.status.toLowerCase().replace(/\s+/g, "-")}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="table-actions">
                    <button className="primary-button table-button" type="button" onClick={() => onSelectClass(row.id)}>
                      View
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8">
                  <div className="inline-empty">
                    <strong>No classes yet</strong>
                    <p>Create your first class to configure fees and start tracking students.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
