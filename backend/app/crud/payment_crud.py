from sqlalchemy.orm import Session, joinedload

from app.models.allocation import Allocation
from app.models.fee_component import FeeComponent
from app.models.payment import Payment


def create_payment(db: Session, student_id: int, amount: int, payment_mode: str) -> Payment:
    payment = Payment(student_id=student_id, amount=amount, payment_mode=payment_mode)
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def get_payment(db: Session, payment_id: int) -> Payment | None:
    return (
        db.query(Payment)
        .options(joinedload(Payment.allocations).joinedload(Allocation.fee_component))
        .filter(Payment.id == payment_id)
        .first()
    )


def update_payment(db: Session, payment: Payment, amount: int, payment_mode: str) -> Payment:
    payment.amount = amount
    payment.payment_mode = payment_mode
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


def get_student_payments(db: Session, student_id: int) -> list[Payment]:
    return (
        db.query(Payment)
        .options(joinedload(Payment.allocations).joinedload(Allocation.fee_component))
        .filter(Payment.student_id == student_id)
        .order_by(Payment.payment_date.asc(), Payment.id.asc())
        .all()
    )
