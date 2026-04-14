from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.crud import fee_crud, student_crud
from app.crud.student_crud import get_student_detail_payload
from app.schemas.student_schema import StudentCreate, StudentDetailRead, StudentRead, StudentUpdate

router = APIRouter(prefix="/students", tags=["Students"])


@router.post("", response_model=StudentRead, status_code=status.HTTP_201_CREATED)
def create_student(payload: StudentCreate, db: Session = Depends(get_db)):
    if not fee_crud.get_class(db, payload.class_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found")
    if student_crud.get_student_by_admission_no(db, payload.admission_no):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admission number already exists")
    return student_crud.create_student(db, payload.dict())


@router.put("/{student_id}", response_model=StudentRead)
def update_student(student_id: int, payload: StudentUpdate, db: Session = Depends(get_db)):
    student = student_crud.get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")

    existing = student_crud.get_student_by_admission_no(db, payload.admission_no)
    if existing and existing.id != student_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Admission number already exists")

    return student_crud.update_student(db, student, payload.dict())


@router.get("/{student_id}", response_model=StudentDetailRead)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = get_student_detail_payload(db, student_id)
    if not student:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Student not found")
    return student
