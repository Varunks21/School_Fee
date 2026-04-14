import React, { useEffect, useState } from "react";
import PaymentForm from "../components/PaymentForm";
import StudentCreateModal from "../components/StudentCreateModal";
import PaymentEditModal from "../components/PaymentEditModal";
import StudentSelector from "../components/StudentSelector";
import { usePayments } from "../hooks/usePayments";
import { createPayment, createStudent, fetchStudent, updateStudent } from "../services/api";

export default function StudentPage({ classes, selectedClass, onBack, onClassChange, onRefreshClasses }) {
  const [searchValue, setSearchValue] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState(selectedClass.students[0]?.id ?? null);
  const [studentDetail, setStudentDetail] = useState(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState("");
  const [paymentDraft, setPaymentDraft] = useState({ amount: "", paymentMode: "Cash" });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState("");
  const [submittingCreate, setSubmittingCreate] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [editingStudentDetail, setEditingStudentDetail] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  useEffect(() => {
    setSelectedStudentId(selectedClass.students[0]?.id ?? null);
  }, [selectedClass]);

  const query = searchValue.trim().toLowerCase();
  const filteredStudents = !query
    ? selectedClass.students
    : selectedClass.students.filter(
        (student) =>
          student.name.toLowerCase().includes(query) || student.guardian.toLowerCase().includes(query)
      );

  const selectedStudent =
    filteredStudents.find((student) => student.id === selectedStudentId) ?? filteredStudents[0] ?? null;

  useEffect(() => {
    let active = true;

    async function loadStudentDetail() {
      if (!selectedStudent?.id) {
        setStudentDetail(null);
        setStudentError("");
        return;
      }

      try {
        setStudentLoading(true);
        setStudentError("");
        const detail = await fetchStudent(selectedStudent.id);
        if (!active) {
          return;
        }
        setStudentDetail(detail);
        setPaymentError("");
      } catch (loadError) {
        if (!active) {
          return;
        }
        setStudentError(loadError.message || "Unable to load student details");
      } finally {
        if (active) {
          setStudentLoading(false);
        }
      }
    }

    loadStudentDetail();

    return () => {
      active = false;
    };
  }, [selectedStudent]);

  const { overview, payments } = usePayments(studentDetail);

  function updatePaymentDraft(key, value) {
    setPaymentDraft((current) => ({ ...current, [key]: value }));
  }

  async function refreshStudentContext(preferredStudentId = selectedStudentId) {
    const refreshedClasses = await onRefreshClasses(selectedClass.id);
    const refreshedClass = refreshedClasses.find((item) => item.id === selectedClass.id);
    if (preferredStudentId) {
      setSelectedStudentId(String(preferredStudentId));
    }
    return refreshedClass;
  }

  async function handleCreateStudent(form) {
    try {
      setSubmittingCreate(true);
      setCreateError("");

      const student = await createStudent({
        ...form,
        classId: selectedClass.id,
      });

      const paymentAmount = Number(form.paymentAmount || 0);
      if (paymentAmount > 0) {
        await createPayment({
          studentId: student.id,
          amount: paymentAmount,
          paymentMode: form.paymentMode,
        });
      }

      const refreshedClasses = await onRefreshClasses(selectedClass.id);
      const refreshedClass = refreshedClasses.find((item) => item.id === selectedClass.id);
      const createdStudent = refreshedClass?.students.find((item) => String(item.id) === String(student.id));
      setSelectedStudentId(String(createdStudent?.id ?? student.id));
      setShowCreateModal(false);
    } catch (error) {
      setCreateError(error.message || "Unable to create student");
    } finally {
      setSubmittingCreate(false);
    }
  }

  async function handleOpenEditModal(studentId) {
    setEditingStudentId(studentId);
    setEditLoading(true);
    setEditError("");
    try {
      const detail = await fetchStudent(studentId);
      setEditingStudentDetail(detail);
    } catch (error) {
      setEditError(error.message || "Unable to load student details");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleEditStudent(draftStudent) {
    if (!editingStudentDetail) {
      return;
    }

    try {
      setSubmittingEdit(true);
      setEditError("");
      await updateStudent({
        studentId: editingStudentId,
        ...draftStudent,
      });
      await refreshStudentContext(editingStudentId);
      setEditingStudentId(null);
      setEditingStudentDetail(null);
    } catch (error) {
      setEditError(error.message || "Unable to update student details");
    } finally {
      setSubmittingEdit(false);
    }
  }

  async function handleAddInstallment(event) {
    event.preventDefault();
    if (!studentDetail) {
      return;
    }

    try {
      setPaymentSubmitting(true);
      setPaymentError("");
      await createPayment({
        studentId: studentDetail.id,
        amount: paymentDraft.amount,
        paymentMode: paymentDraft.paymentMode,
      });
      setPaymentDraft({ amount: "", paymentMode: "Cash" });
      await refreshStudentContext(studentDetail.id);
      const detail = await fetchStudent(studentDetail.id);
      setStudentDetail(detail);
    } catch (error) {
      setPaymentError(error.message || "Unable to add installment");
    } finally {
      setPaymentSubmitting(false);
    }
  }

  return (
    <div className="page detail-page">
      <section className="panel detail-topbar">
        <div>
          <button className="back-link" type="button" onClick={onBack}>
            Back to dashboard
          </button>
          <h1>
            {selectedClass.name}{" "}
            <span>{selectedClass.section === "-" ? "Section pending" : `Section ${selectedClass.section}`}</span>
          </h1>
          <p>
            {selectedClass.teacher} | {selectedClass.academicYear}
          </p>
        </div>

        <label className="class-switcher">
          <span>Jump to class</span>
          <select
            value={selectedClass.id}
            onChange={(event) => {
              onClassChange(event.target.value);
              setSearchValue("");
            }}
          >
            {classes.map((classroom) => (
              <option key={classroom.id} value={classroom.id}>
                {classroom.name} - Section {classroom.section}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="detail-grid">
        <StudentSelector
          students={filteredStudents}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          selectedStudentId={selectedStudent?.id}
          onSelectStudent={setSelectedStudentId}
          onAddStudent={() => setShowCreateModal(true)}
          onEditStudent={handleOpenEditModal}
        />
        {!selectedStudent ? (
          <section className="payment-preview panel empty-state compact-empty-state">
            <p className="eyebrow">No student selected</p>
            <h2>This class has no matching students yet.</h2>
          </section>
        ) : studentLoading ? (
          <section className="payment-preview panel empty-state compact-empty-state">
            <p className="eyebrow">Loading</p>
            <h2>Fetching payment details for {selectedStudent?.name ?? "student"}...</h2>
          </section>
        ) : studentError ? (
          <section className="payment-preview panel empty-state compact-empty-state">
            <p className="eyebrow">Unable to load</p>
            <h2>{studentError}</h2>
          </section>
        ) : (
          <PaymentForm
            student={studentDetail ? { ...studentDetail, academicYear: selectedClass.academicYear } : null}
            overview={overview}
            payments={payments}
            paymentDraft={paymentDraft}
            onPaymentDraftChange={updatePaymentDraft}
            onPaymentSubmit={handleAddInstallment}
            paymentSubmitting={paymentSubmitting}
            paymentError={paymentError}
          />
        )}
      </div>

      {showCreateModal ? (
        <StudentCreateModal
          className={selectedClass.name}
          onClose={() => {
            setShowCreateModal(false);
            setCreateError("");
          }}
          onSubmit={handleCreateStudent}
          submitting={submittingCreate}
          error={createError}
        />
      ) : null}

      {editingStudentId ? (
        <PaymentEditModal
          student={editingStudentDetail}
          loading={editLoading}
          error={editError}
          submitting={submittingEdit}
          onClose={() => {
            setEditingStudentId(null);
            setEditingStudentDetail(null);
            setEditError("");
          }}
          onSubmit={handleEditStudent}
        />
      ) : null}
    </div>
  );
}
