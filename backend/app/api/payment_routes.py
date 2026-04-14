from fastapi import APIRouter

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("/")
def list_payments():
    return {"message": "payment routes scaffold"}
