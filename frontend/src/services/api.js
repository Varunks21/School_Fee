const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

async function request(path) {
  const response = await fetch(`${API_BASE_URL}${path}`);
  return handleResponse(response);
}

async function requestJson(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });
  return handleResponse(response);
}

async function handleResponse(response) {
  if (!response.ok) {
    let message = "Request failed";

    try {
      const data = await response.json();
      message = data.detail ?? message;
    } catch {
      message = response.statusText || message;
    }

    throw new Error(message);
  }

  return response.json();
}

function formatCurrency(value) {
  return currencyFormatter.format(value ?? 0);
}

function formatDate(value) {
  if (!value) {
    return "No payment yet";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export async function fetchClasses() {
  const classes = await request("/classes");

  return classes.map((item) => ({
    id: String(item.id),
    name: item.name,
    section: item.students[0]?.section ?? "-",
    teacher: item.student_count ? `${item.student_count} students enrolled` : "No students enrolled",
    academicYear: "Current academic year",
    studentCount: item.student_count,
    totalFee: item.total_fee,
    totalPaid: item.total_paid,
    totalBalance: item.total_balance,
    totalPaidLabel: formatCurrency(item.total_paid),
    totalDueLabel: formatCurrency(item.total_balance),
    students: item.students.map((student) => ({
      id: String(student.id),
      name: student.name,
      rollNo: student.admission_no,
      guardian: student.parent_name,
      phone: student.parent_contact_number,
      paid: student.total_paid,
      due: student.total_balance,
      attendance: student.total_balance === 0 ? "Cleared" : "Pending",
      lastPaymentDate: formatDate(student.last_payment_date),
    })),
  }));
}

export async function createClass(payload) {
  const classroom = await requestJson("/classes", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
    }),
  });

  return {
    id: String(classroom.id),
    name: classroom.name,
  };
}

export async function fetchFeeComponents() {
  const components = await request("/fee-components");

  return components.map((component) => ({
    id: String(component.id),
    name: component.name,
  }));
}

export async function createFeeComponent(payload) {
  const component = await requestJson("/fee-components", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
    }),
  });

  return {
    id: String(component.id),
    name: component.name,
  };
}

export async function fetchClassFeeStructure(classId) {
  try {
    const structure = await request(`/class-fee-structure/${classId}`);
    return structure.fees.map((item) => ({
      id: String(item.id),
      componentId: String(item.component_id),
      componentName: item.component_name,
      amount: Number(item.amount),
      priority: Number(item.priority),
    }));
  } catch (error) {
    if (error.message === "Class fee structure not found") {
      return [];
    }
    throw error;
  }
}

export async function saveClassFeeStructure(payload) {
  const structure = await requestJson(`/class-fee-structure/${payload.classId}`, {
    method: "PUT",
    body: JSON.stringify({
      class_id: Number(payload.classId),
      fees: payload.fees.map((item) => ({
        component_id: Number(item.componentId),
        amount: Number(item.amount),
        priority: Number(item.priority),
      })),
    }),
  });

  return structure.fees.map((item) => ({
    id: String(item.id),
    componentId: String(item.component_id),
    componentName: item.component_name,
    amount: Number(item.amount),
    priority: Number(item.priority),
  }));
}

export async function fetchStudent(studentId) {
  const student = await request(`/students/${studentId}`);

  return {
    id: String(student.id),
    name: student.name,
    admissionNo: student.admission_no,
    classId: String(student.class_id),
    className: student.class_name,
    section: student.section,
    parentName: student.parent_name,
    parentContactNumber: student.parent_contact_number,
    totalFee: student.total_fee,
    totalPaid: student.total_paid,
    totalBalance: student.total_balance,
    feeBreakdown: student.fee_breakdown.map((item) => ({
      label: item.component_name,
      amount: item.total_amount,
      status:
        item.balance_amount === 0 ? "Paid" : item.paid_amount === 0 ? "Pending" : "Partial",
      paidAmount: item.paid_amount,
      balanceAmount: item.balance_amount,
    })),
    payments: [...student.payment_history]
      .sort((left, right) => new Date(right.payment_date) - new Date(left.payment_date))
      .map((payment) => ({
      id: String(payment.payment_id),
      date: formatDate(payment.payment_date),
      rawDate: payment.payment_date,
      mode: payment.payment_mode,
      amount: payment.amount,
      reference: `Installment #${payment.payment_id}`,
    })),
  };
}

export async function createStudent(payload) {
  return requestJson("/students", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      admission_no: payload.admissionNo,
      class_id: Number(payload.classId),
      section: payload.section,
      parent_name: payload.parentName,
      parent_contact_number: payload.parentContactNumber,
    }),
  });
}

export async function updateStudent(payload) {
  return requestJson(`/students/${payload.studentId}`, {
    method: "PUT",
    body: JSON.stringify({
      name: payload.name,
      admission_no: payload.admissionNo,
      section: payload.section,
      parent_name: payload.parentName,
      parent_contact_number: payload.parentContactNumber,
    }),
  });
}

export async function createPayment(payload) {
  return requestJson("/payments/pay", {
    method: "POST",
    body: JSON.stringify({
      student_id: Number(payload.studentId),
      amount: Number(payload.amount),
      payment_mode: payload.paymentMode,
    }),
  });
}

export async function updatePayment(payload) {
  return requestJson(`/payments/${payload.paymentId}`, {
    method: "PUT",
    body: JSON.stringify({
      amount: Number(payload.amount),
      payment_mode: payload.paymentMode,
    }),
  });
}

export function getDashboardMetrics(classes) {
  const students = classes.flatMap((item) => item.students);
  const totalCollected = classes.reduce((sum, item) => sum + item.totalPaid, 0);
  const totalOutstanding = classes.reduce((sum, item) => sum + item.totalBalance, 0);
  const totalFee = classes.reduce((sum, item) => sum + item.totalFee, 0);
  const collectionRate = totalFee ? Math.round((totalCollected / totalFee) * 100) : 0;

  return [
    {
      id: "collected",
      label: "Total Collected",
      value: formatCurrency(totalCollected),
      helper: "Across all classes",
    },
    {
      id: "outstanding",
      label: "Outstanding Due",
      value: formatCurrency(totalOutstanding),
      helper: "Pending collections",
    },
    {
      id: "students",
      label: "Students",
      value: `${students.length}`,
      helper: "Fee profiles tracked",
    },
    {
      id: "rate",
      label: "Collection Rate",
      value: `${collectionRate}%`,
      helper: "Based on assigned fees",
    },
  ];
}

export function getClassRows(classes) {
  return classes.map((classroom) => ({
    ...classroom,
    status:
      classroom.studentCount === 0
        ? "Empty"
        : classroom.totalBalance === 0
          ? "Cleared"
          : classroom.totalBalance > 10000
            ? "Attention"
            : "On Track",
  }));
}

export function getClassFeePreview(classroom) {
  const studentCount = classroom.studentCount || 0;
  if (!studentCount) {
    return "No students yet";
  }

  if (!classroom.totalFee) {
    return "Fee structure not configured";
  }

  const perStudent = Math.round(classroom.totalFee / studentCount);
  return `${formatCurrency(perStudent)} per student`;
}

export function getStudentOverview(student) {
  if (!student) {
    return null;
  }

  return {
    totalFee: formatCurrency(student.totalFee),
    paid: formatCurrency(student.totalPaid),
    due: formatCurrency(student.totalBalance),
  };
}
