from datetime import datetime

from pydantic import BaseModel, Field


class PaymentBase(BaseModel):
    student_id: int
    amount: int = Field(..., gt=0)
    payment_mode: str


class PaymentCreate(PaymentBase):
    pass


class PaymentUpdate(BaseModel):
    amount: int = Field(..., gt=0)
    payment_mode: str


class PaymentAllocationRead(BaseModel):
    component_id: int
    component_name: str
    class_fee_id: int
    allocated_amount: int


class PaymentRead(PaymentBase):
    id: int
    payment_date: datetime
    allocations: list[PaymentAllocationRead] = []

    class Config:
        from_attributes = True
