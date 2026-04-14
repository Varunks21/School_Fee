from pydantic import BaseModel


class PaymentBase(BaseModel):
    student_id: int
    amount: int
    payment_mode: str


class PaymentCreate(PaymentBase):
    pass


class PaymentRead(PaymentBase):
    id: int

    class Config:
        from_attributes = True
