import React from "react";
import FeeConfigModal from "../components/FeeConfigModal";
import FeeTable from "../components/FeeTable";
import { getClassRows, getDashboardMetrics } from "../services/api";

export default function Dashboard({ classes, onSelectClass, onRefreshClasses }) {
  const metrics = getDashboardMetrics(classes);
  const rows = getClassRows(classes);
  const [configClassId, setConfigClassId] = React.useState(null);
  const [modalIntent, setModalIntent] = React.useState("configure");

  return (
    <div className="page dashboard-page">
      <section className="hero-banner panel">
        <div>
          <p className="eyebrow">School Fee Dashboard</p>
          <h1>Track collections, class performance, and payment follow-up from one place.</h1>
        </div>
        <button className="primary-button" type="button" onClick={() => setConfigClassId(classes[0]?.id ?? null)}>
          Configure standards
        </button>
      </section>

      <section className="kpi-grid">
        {metrics.map((metric) => (
          <article key={metric.id} className="kpi-card panel">
            <p>{metric.label}</p>
            <strong>{metric.value}</strong>
            <span>{metric.helper}</span>
          </article>
        ))}
      </section>

      <FeeTable
        rows={rows}
        onSelectClass={onSelectClass}
        onConfigureFees={(classId) => {
          setModalIntent("configure");
          setConfigClassId(classId);
        }}
        onAddClass={() => {
          setModalIntent("add-class");
          setConfigClassId(rows[0]?.id ?? classes[0]?.id ?? null);
        }}
      />

      {configClassId ? (
        <FeeConfigModal
          classes={rows}
          selectedClassId={configClassId}
          intent={modalIntent}
          onClose={() => setConfigClassId(null)}
          onSaved={onRefreshClasses}
        />
      ) : null}
    </div>
  );
}
