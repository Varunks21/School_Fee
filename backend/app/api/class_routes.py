from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import fee_crud
from app.crud.student_crud import get_classes_overview_payload
from app.schemas.student_schema import ClassCreate, ClassSummaryRead, StudentClassRead

router = APIRouter(prefix="/classes", tags=["Classes"])


@router.post("", response_model=StudentClassRead, status_code=status.HTTP_201_CREATED)
def create_class(payload: ClassCreate, db: Session = Depends(get_db)):
    normalized_name = payload.name.strip()
    if not normalized_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Class name is required")
    if fee_crud.get_class_by_name(db, normalized_name):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Class already exists")
    return fee_crud.create_class(db, normalized_name)


@router.get("", response_model=list[ClassSummaryRead])
def list_classes(db: Session = Depends(get_db)):
    return get_classes_overview_payload(db)
