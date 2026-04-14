from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import payment_crud, student_crud
from app.schemas.payment_schema import PaymentAllocationRead, PaymentCreate, PaymentRead, PaymentUpdate
from app.services.allocation_service import rebuild_student_allocations

router = APIRouter(prefix="/payments", tags=["Payments"])


def _serialize_payment(payment):
    return PaymentRead(
        id=payment.id,
        student_id=payment.student_id,
        amount=int(payment.amount),
        payment_mode=payment.payment_mode,
        payment_date=payment.payment_date,
        allocations=[
            PaymentAllocationRead(
                component_id=allocation.fee_component_id,
                component_name=allocation.fee_component.name,
                class_fee_id=allocation.class_fee_id,
                allocated_amount=int(allocation.allocated_amount),
            )
            for allocation in payment.allocations
        ],
    )


@router.post("/pay", response_model=PaymentRead, status_code=status.HTTP_201_CREATED)
def create_payment(payload: PaymentCreate, db: Session = Depends(get_db)):
    if not student_crud.get_student(db, payload.student_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    payment = payment_crud.create_payment(db, payload.student_id, payload.amount, payload.payment_mode)
    try:
        rebuild_student_allocations(db, payload.student_id)
    except ValueError as exc:
        db.delete(payment)
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    payment = payment_crud.get_payment(db, payment.id)
    return _serialize_payment(payment)


@router.put("/{payment_id}", response_model=PaymentRead)
def update_payment(payment_id: int, payload: PaymentUpdate, db: Session = Depends(get_db)):
    payment = payment_crud.get_payment(db, payment_id)
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    payment = payment_crud.update_payment(db, payment, payload.amount, payload.payment_mode)
    try:
        rebuild_student_allocations(db, payment.student_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    payment = payment_crud.get_payment(db, payment_id)
    return _serialize_payment(payment)
