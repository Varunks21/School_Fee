from collections import defaultdict
from decimal import Decimal

from sqlalchemy.orm import Session, joinedload

from app.crud.payment_crud import get_student_payments
from app.models.class_fee import ClassFee
from app.models.class_model import ClassModel
from app.models.student import Student


def create_student(db: Session, payload: dict) -> Student:
    student = Student(**payload)
    db.add(student)
    db.commit()
    db.refresh(student)
    return get_student(db, student.id)


def update_student(db: Session, student: Student, payload: dict) -> Student:
    for key, value in payload.items():
        setattr(student, key, value)
    db.add(student)
    db.commit()
    db.refresh(student)
    return get_student(db, student.id)


def get_student_by_admission_no(db: Session, admission_no: str) -> Student | None:
    return db.query(Student).filter(Student.admission_no == admission_no).first()


def get_student(db: Session, student_id: int) -> Student | None:
    return (
        db.query(Student)
        .options(
            joinedload(Student.student_class)
            .joinedload(ClassModel.fee_structures)
            .joinedload(ClassFee.fee_component)
        )
        .filter(Student.id == student_id)
        .first()
    )


def get_student_detail_payload(db: Session, student_id: int) -> dict | None:
    student = get_student(db, student_id)
    if not student:
        return None

    fee_structures = sorted(student.student_class.fee_structures, key=lambda item: (item.priority, item.id))
    payments = get_student_payments(db, student_id)

    paid_by_component: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
    payment_history = []

    for payment in payments:
        payment_history.append(
            {
                "payment_id": payment.id,
                "amount": int(payment.amount),
                "payment_mode": payment.payment_mode,
                "payment_date": payment.payment_date.isoformat(),
            }
        )
        for allocation in payment.allocations:
            paid_by_component[allocation.fee_component_id] += allocation.allocated_amount

    fee_breakdown = []
    total_fee = Decimal("0")
    total_paid = Decimal("0")

    for class_fee in fee_structures:
        paid_amount = paid_by_component[class_fee.fee_component_id]
        balance_amount = max(class_fee.amount - paid_amount, Decimal("0"))
        total_fee += class_fee.amount
        total_paid += paid_amount
        fee_breakdown.append(
            {
                "component_id": class_fee.fee_component_id,
                "component_name": class_fee.fee_component.name,
                "priority": class_fee.priority,
                "total_amount": int(class_fee.amount),
                "paid_amount": int(paid_amount),
                "balance_amount": int(balance_amount),
            }
        )

    return {
        "id": student.id,
        "name": student.name,
        "admission_no": student.admission_no,
        "class_id": student.class_id,
        "class_name": student.student_class.name,
        "section": student.section,
        "parent_name": student.parent_name,
        "parent_contact_number": student.parent_contact_number,
        "total_fee": int(total_fee),
        "total_paid": int(total_paid),
        "total_balance": int(max(total_fee - total_paid, Decimal("0"))),
        "fee_breakdown": fee_breakdown,
        "payment_history": payment_history,
    }


def get_classes_overview_payload(db: Session) -> list[dict]:
    classes = (
        db.query(ClassModel)
        .options(
            joinedload(ClassModel.students).joinedload(Student.payments),
            joinedload(ClassModel.fee_structures).joinedload(ClassFee.fee_component),
        )
        .order_by(ClassModel.name.asc())
        .all()
    )

    class_payloads = []

    for school_class in classes:
        fee_structures = sorted(school_class.fee_structures, key=lambda item: (item.priority, item.id))
        total_fee_per_student = sum(int(item.amount) for item in fee_structures)

        students_payload = []
        total_fee = 0
        total_paid = 0

        for student in school_class.students:
            payments = sorted(student.payments, key=lambda item: (item.payment_date, item.id))
            student_paid = sum(int(payment.amount) for payment in payments)
            student_balance = max(total_fee_per_student - student_paid, 0)
            total_fee += total_fee_per_student
            total_paid += student_paid
            last_payment_date = payments[-1].payment_date.isoformat() if payments else None

            students_payload.append(
                {
                    "id": student.id,
                    "name": student.name,
                    "admission_no": student.admission_no,
                    "section": student.section,
                    "parent_name": student.parent_name,
                    "parent_contact_number": student.parent_contact_number,
                    "total_paid": student_paid,
                    "total_balance": student_balance,
                    "last_payment_date": last_payment_date,
                }
            )

        class_payloads.append(
            {
                "id": school_class.id,
                "name": school_class.name,
                "student_count": len(school_class.students),
                "total_fee": total_fee,
                "total_paid": total_paid,
                "total_balance": max(total_fee - total_paid, 0),
                "students": sorted(students_payload, key=lambda item: item["name"].lower()),
            }
        )

    return class_payloads
