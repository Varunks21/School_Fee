from typing import Optional

from pydantic import BaseModel


class ClassStudentSummaryRead(BaseModel):
    id: int
    name: str
    admission_no: str
    section: str
    parent_name: str
    parent_contact_number: str
    total_fee: int
    total_paid: int
    total_balance: int
    last_payment_date: Optional[str]


class ClassSummaryRead(BaseModel):
    id: int
    name: str
    student_count: int
    total_fee: int
    total_paid: int
    total_balance: int
    students: list[ClassStudentSummaryRead]
