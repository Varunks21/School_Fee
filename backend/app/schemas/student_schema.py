from pydantic import BaseModel


class StudentBase(BaseModel):
    name: str
    admission_no: str
    class_id: int
    section: str = "A"
    parent_name: str
    parent_contact_number: str


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: str
    admission_no: str
    section: str = "A"
    parent_name: str
    parent_contact_number: str


class StudentClassRead(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class StudentFeeSummaryItem(BaseModel):
    component_id: int
    component_name: str
    priority: int
    total_amount: int
    paid_amount: int
    balance_amount: int


class StudentPaymentHistoryItem(BaseModel):
    payment_id: int
    amount: int
    payment_mode: str
    payment_date: str


class StudentRead(StudentBase):
    id: int
    student_class: StudentClassRead

    class Config:
        from_attributes = True


class StudentDetailRead(BaseModel):
    id: int
    name: str
    admission_no: str
    class_id: int
    class_name: str
    section: str
    parent_name: str
    parent_contact_number: str
    total_fee: int
    total_paid: int
    total_balance: int
    fee_breakdown: list[StudentFeeSummaryItem]
    payment_history: list[StudentPaymentHistoryItem]


class ClassStudentSummaryRead(BaseModel):
    id: int
    name: str
    admission_no: str
    section: str
    parent_name: str
    parent_contact_number: str
    total_paid: int
    total_balance: int
    last_payment_date: str | None


class ClassSummaryRead(BaseModel):
    id: int
    name: str
    student_count: int
    total_fee: int
    total_paid: int
    total_balance: int
    students: list[ClassStudentSummaryRead]


class ClassCreate(BaseModel):
    name: str
