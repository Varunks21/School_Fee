from fastapi import APIRouter

router = APIRouter(prefix="/fees", tags=["Fees"])


@router.get("/")
def list_fees():
    return {"message": "fee routes scaffold"}
