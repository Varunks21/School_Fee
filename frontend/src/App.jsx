import React, { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import StudentPage from "./pages/StudentPage";
import { fetchClasses } from "./services/api";
import "./styles.css";

export default function App() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedClassId, setSelectedClassId] = useState(null);
  const selectedClass = classes.find((item) => item.id === selectedClassId) ?? null;

  useEffect(() => {
    let active = true;

    async function loadClasses() {
      try {
        setLoading(true);
        setError("");
        const response = await fetchClasses();
        if (!active) {
          return;
        }
        setClasses(response);
      } catch (loadError) {
        if (!active) {
          return;
        }
        setError(loadError.message || "Unable to load dashboard data");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadClasses();

    return () => {
      active = false;
    };
  }, []);

  async function reloadClasses(preferredClassId = selectedClassId) {
    setError("");
    try {
      const response = await fetchClasses();
      setClasses(response);
      if (preferredClassId && response.some((item) => item.id === preferredClassId)) {
        setSelectedClassId(preferredClassId);
      } else if (preferredClassId) {
        setSelectedClassId(null);
      }
      return response;
    } catch (loadError) {
      setError(loadError.message || "Unable to load dashboard data");
      throw loadError;
    }
  }

  if (loading) {
    return (
      <main className="app-shell">
        <section className="page panel empty-state">
          <p className="eyebrow">Loading</p>
          <h1>Fetching class and payment data...</h1>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main className="app-shell">
        <section className="page panel empty-state">
          <p className="eyebrow">Connection issue</p>
          <h1>{error}</h1>
          <button className="primary-button" type="button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      {selectedClass ? (
        <StudentPage
          classes={classes}
          selectedClass={selectedClass}
          onBack={() => setSelectedClassId(null)}
          onClassChange={setSelectedClassId}
          onRefreshClasses={reloadClasses}
        />
      ) : (
        <Dashboard classes={classes} onSelectClass={setSelectedClassId} onRefreshClasses={reloadClasses} />
      )}
    </main>
  );
}
