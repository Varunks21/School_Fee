import React from "react";
import FeeConfigModal from "../components/FeeConfigModal";
import FeeTable from "../components/FeeTable";
import { getClassRows, getDashboardMetrics } from "../services/api";

export default function Dashboard({ classes, onSelectClass, onRefreshClasses }) {
  const metrics = getDashboardMetrics(classes);
  const rows = getClassRows(classes);
  const [isConfigModalOpen, setIsConfigModalOpen] = React.useState(false);
  const [configClassId, setConfigClassId] = React.useState(null);
  const [modalIntent, setModalIntent] = React.useState("configure");

  function openConfigModal(intent, classId = null) {
    setModalIntent(intent);
    setConfigClassId(classId ?? "");
    setIsConfigModalOpen(true);
  }

  function closeConfigModal() {
    setIsConfigModalOpen(false);
    setConfigClassId(null);
  }

  return (
    <div className="page dashboard-page">
      <section className="hero-banner panel">
        <div>
          <h1>School Fee Dashboard</h1>
        </div>
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
        onConfigureFees={(classId) => openConfigModal("configure", classId)}
        onAddClass={() => openConfigModal("add-class", rows[0]?.id ?? classes[0]?.id ?? null)}
      />

      {isConfigModalOpen ? (
        <FeeConfigModal
          classes={rows}
          selectedClassId={configClassId}
          intent={modalIntent}
          onClose={closeConfigModal}
          onSaved={onRefreshClasses}
        />
      ) : null}
    </div>
  );
}
