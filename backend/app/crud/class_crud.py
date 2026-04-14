from collections import defaultdict
from decimal import Decimal

from sqlalchemy.orm import Session, joinedload

from app.models.allocation import Allocation
from app.models.class_fee import ClassFee
from app.models.class_model import ClassModel
from app.models.payment import Payment
from app.models.student import Student


def get_class_dashboard_payload(db: Session) -> list[dict]:
    classes = (
        db.query(ClassModel)
        .options(
            joinedload(ClassModel.students)
            .joinedload(Student.payments)
            .joinedload(Payment.allocations),
            joinedload(ClassModel.fee_structures).joinedload(ClassFee.fee_component),
        )
        .order_by(ClassModel.name.asc(), ClassModel.id.asc())
        .all()
    )

    payload = []

    for class_model in classes:
        fee_structures = sorted(class_model.fee_structures, key=lambda item: (item.priority, item.id))
        total_class_fee = Decimal("0")
        total_class_paid = Decimal("0")
        students_payload = []

        for student in sorted(class_model.students, key=lambda item: (item.section, item.name, item.id)):
            fee_total = sum((class_fee.amount for class_fee in fee_structures), Decimal("0"))
            paid_by_component: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
            last_payment_date = None

            for payment in sorted(student.payments, key=lambda item: (item.payment_date, item.id)):
                last_payment_date = payment.payment_date.isoformat()
                for allocation in payment.allocations:
                    paid_by_component[allocation.fee_component_id] += allocation.allocated_amount

            total_paid = sum(
                (paid_by_component[class_fee.fee_component_id] for class_fee in fee_structures),
                Decimal("0"),
            )
            total_balance = max(fee_total - total_paid, Decimal("0"))

            total_class_fee += fee_total
            total_class_paid += total_paid

            students_payload.append(
                {
                    "id": student.id,
                    "name": student.name,
                    "admission_no": student.admission_no,
                    "section": student.section,
                    "parent_name": student.parent_name,
                    "parent_contact_number": student.parent_contact_number,
                    "total_fee": int(fee_total),
                    "total_paid": int(total_paid),
                    "total_balance": int(total_balance),
                    "last_payment_date": last_payment_date,
                }
            )

        payload.append(
            {
                "id": class_model.id,
                "name": class_model.name,
                "student_count": len(class_model.students),
                "total_fee": int(total_class_fee),
                "total_paid": int(total_class_paid),
                "total_balance": int(max(total_class_fee - total_class_paid, Decimal("0"))),
                "students": students_payload,
            }
        )

    return payload
