from pydantic import BaseModel


class FeeComponentSchema(BaseModel):
    name: str


class ClassFeeSchema(BaseModel):
    class_id: int
    fee_component_id: int
    amount: int
