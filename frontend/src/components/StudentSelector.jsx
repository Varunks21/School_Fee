import React from "react";

export default function StudentSelector({
  students,
  searchValue,
  onSearchChange,
  selectedStudentId,
  onSelectStudent,
  onAddStudent,
  onEditStudent,
}) {
  return (
    <aside className="student-sidebar panel">
      <div className="student-sidebar-header">
        <div>
          <p className="eyebrow">Students</p>
          <h2>Class roster</h2>
        </div>
        <div className="sidebar-actions">
          <span className="count-badge">{students.length}</span>
          <button className="icon-button" type="button" onClick={onAddStudent} aria-label="Add student">
            +
          </button>
        </div>
      </div>

      <label className="search-field">
        <span>Search</span>
        <input
          type="text"
          placeholder="Search by student or guardian"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <div className="student-list">
        {students.length ? (
          students.map((student) => (
            <div
              key={student.id}
              className={`student-card ${selectedStudentId === student.id ? "selected" : ""}`}
              onClick={() => onSelectStudent(student.id)}
              role="button"
              tabIndex={0}
            >
              <div>
                <strong>{student.name}</strong>
                <p>Admission No {student.rollNo}</p>
              </div>
              <div className="student-meta">
                <span>{student.attendance}</span>
                <small>{student.due === 0 ? "Cleared" : `Due ${student.due.toLocaleString("en-IN")}`}</small>
              </div>
              <button
                className="student-edit-button"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onEditStudent(student.id);
                }}
              >
                Edit profile
              </button>
            </div>
          ))
        ) : (
          <div className="inline-empty">
            <strong>No students found</strong>
            <p>Try a different search or add students to this class.</p>
          </div>
        )}
      </div>
    </aside>
  );
}
