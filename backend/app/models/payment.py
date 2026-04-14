from sqlalchemy import Column, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import relationship

from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column("payment_id", Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.student_id"), nullable=False)
    amount = Column("amount_paid", Numeric(10, 2), nullable=False)
    payment_mode = Column(String(20), nullable=False)
    payment_date = Column(DateTime(timezone=False), nullable=False, server_default=func.now())

    student = relationship("Student", back_populates="payments")
    allocations = relationship(
        "Allocation",
        back_populates="payment",
        cascade="all, delete-orphan",
    )
