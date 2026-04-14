from collections import defaultdict
from decimal import Decimal

from sqlalchemy.orm import Session, joinedload

from app.models.allocation import Allocation
from app.models.class_fee import ClassFee
from app.models.fee_component import FeeComponent
from app.models.payment import Payment
from app.models.student import Student


def rebuild_student_allocations(db: Session, student_id: int) -> list[Payment]:
    student = (
        db.query(Student)
        .options(joinedload(Student.student_class))
        .filter(Student.id == student_id)
        .first()
    )
    if not student:
        raise ValueError("Student not found")

    class_fees = (
        db.query(ClassFee)
        .options(joinedload(ClassFee.fee_component))
        .filter(ClassFee.class_id == student.class_id)
        .order_by(ClassFee.priority.asc(), ClassFee.id.asc())
        .all()
    )
    if not class_fees:
        raise ValueError("Fee structure not configured for student's class")

    payments = (
        db.query(Payment)
        .options(joinedload(Payment.allocations))
        .filter(Payment.student_id == student_id)
        .order_by(Payment.payment_date.asc(), Payment.id.asc())
        .all()
    )

    for payment in payments:
        payment.allocations.clear()

    db.flush()

    paid_by_component: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))

    for payment in payments:
        remaining = Decimal(payment.amount)
        for class_fee in class_fees:
            due = max(class_fee.amount - paid_by_component[class_fee.fee_component_id], Decimal("0"))
            if due <= 0:
                continue

            allocated_amount = min(remaining, due)
            if allocated_amount <= 0:
                continue

            payment.allocations.append(
                Allocation(
                    class_fee_id=class_fee.id,
                    fee_component_id=class_fee.fee_component_id,
                    allocated_amount=allocated_amount,
                )
            )
            paid_by_component[class_fee.fee_component_id] += allocated_amount
            remaining -= allocated_amount

            if remaining == 0:
                break

    db.commit()

    return (
        db.query(Payment)
        .options(joinedload(Payment.allocations).joinedload(Allocation.fee_component))
        .filter(Payment.student_id == student_id)
        .order_by(Payment.payment_date.asc(), Payment.id.asc())
        .all()
    )
