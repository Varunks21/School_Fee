from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.api.class_routes import router as class_router
from app.api.fee_routes import router as fee_router
from app.api.payment_routes import router as payment_router
from app.api.student_routes import router as student_router
from app.core.database import Base, engine
from app.models.allocation import Allocation
from app.models.class_fee import ClassFee
from app.models.class_model import ClassModel
from app.models.fee_component import FeeComponent
from app.models.payment import Payment
from app.models.student import Student

app = FastAPI(title="School Fee System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:3003",
        "http://127.0.0.1:3003",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

try:
    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE class_fee_structure ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 1"
            )
        )
        connection.execute(
            text(
                "ALTER TABLE payment_allocations ADD COLUMN IF NOT EXISTS class_fee_id INTEGER"
            )
        )
except SQLAlchemyError:
    pass

app.include_router(class_router)
app.include_router(fee_router)
app.include_router(payment_router)
app.include_router(student_router)


@app.get("/")
def root():
    return {"message": "School Fee System API is running"}
