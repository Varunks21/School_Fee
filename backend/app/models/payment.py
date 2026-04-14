from sqlalchemy import Column, Integer, String

from app.core.database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, nullable=False)
    amount = Column(Integer, nullable=False)
    payment_mode = Column(String, nullable=False)
