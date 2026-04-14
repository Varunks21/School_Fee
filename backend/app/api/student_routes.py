from fastapi import APIRouter

router = APIRouter(prefix="/students", tags=["Students"])


@router.get("/")
def list_students():
    return {"message": "student routes scaffold"}
