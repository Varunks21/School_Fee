from pydantic import BaseModel, Field


class FeeComponentCreate(BaseModel):
    name: str


class FeeComponentRead(FeeComponentCreate):
    id: int

    class Config:
        from_attributes = True


class ClassFeeItemBase(BaseModel):
    component_id: int
    amount: int = Field(..., ge=0)
    priority: int = Field(..., ge=1)


class ClassFeeItemCreate(ClassFeeItemBase):
    pass


class ClassFeeItemRead(ClassFeeItemBase):
    id: int
    component_name: str


class ClassFeeStructureCreate(BaseModel):
    class_id: int
    fees: list[ClassFeeItemCreate]


class ClassFeeStructureRead(BaseModel):
    class_id: int
    fees: list[ClassFeeItemRead]
