from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import fee_crud
from app.schemas.fee_schema import (
    ClassFeeItemRead,
    ClassFeeStructureCreate,
    ClassFeeStructureRead,
    FeeComponentCreate,
    FeeComponentRead,
)

router = APIRouter(tags=["Fees"])


@router.post("/fee-components", response_model=FeeComponentRead, status_code=status.HTTP_201_CREATED)
def create_fee_component(payload: FeeComponentCreate, db: Session = Depends(get_db)):
    existing = next((item for item in fee_crud.get_fee_components(db) if item.name.lower() == payload.name.lower()), None)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Fee component already exists")
    return fee_crud.create_fee_component(db, payload.name)


@router.get("/fee-components", response_model=list[FeeComponentRead])
def get_fee_components(db: Session = Depends(get_db)):
    return fee_crud.get_fee_components(db)


@router.post("/class-fee-structure", response_model=ClassFeeStructureRead, status_code=status.HTTP_201_CREATED)
def create_class_fee_structure(payload: ClassFeeStructureCreate, db: Session = Depends(get_db)):
    if not fee_crud.get_class(db, payload.class_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    records = fee_crud.replace_class_fee_structure(db, payload.class_id, [fee.dict() for fee in payload.fees])
    return {
        "class_id": payload.class_id,
        "fees": [
            ClassFeeItemRead(
                id=record.id,
                component_id=record.fee_component_id,
                component_name=record.fee_component.name,
                amount=record.amount,
                priority=record.priority,
            )
            for record in records
        ],
    }


@router.put("/class-fee-structure/{class_id}", response_model=ClassFeeStructureRead)
def update_class_fee_structure(class_id: int, payload: ClassFeeStructureCreate, db: Session = Depends(get_db)):
    if not fee_crud.get_class(db, class_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    records = fee_crud.replace_class_fee_structure(db, class_id, [fee.dict() for fee in payload.fees])
    return {
        "class_id": class_id,
        "fees": [
            ClassFeeItemRead(
                id=record.id,
                component_id=record.fee_component_id,
                component_name=record.fee_component.name,
                amount=record.amount,
                priority=record.priority,
            )
            for record in records
        ],
    }


@router.get("/class-fee-structure/{class_id}", response_model=ClassFeeStructureRead)
def get_class_fee_structure(class_id: int, db: Session = Depends(get_db)):
    records = fee_crud.get_class_fee_structure(db, class_id)
    if not records:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class fee structure not found")
    return {
        "class_id": class_id,
        "fees": [
            ClassFeeItemRead(
                id=record.id,
                component_id=record.fee_component_id,
                component_name=record.fee_component.name,
                amount=record.amount,
                priority=record.priority,
            )
            for record in records
        ],
    }
