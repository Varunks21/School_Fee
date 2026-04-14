import { getStudentOverview } from "../services/api";

export function usePayments(student) {
  if (!student) {
    return {
      overview: null,
      payments: [],
      loading: false,
    };
  }

  return {
    overview: getStudentOverview(student),
    payments: student.payments,
    loading: false,
  };
}
