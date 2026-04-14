from pydantic import BaseModel


class StudentBase(BaseModel):
    name: str
    admission_no: str


class StudentCreate(StudentBase):
    pass


class StudentRead(StudentBase):
    id: int

    class Config:
        from_attributes = True
