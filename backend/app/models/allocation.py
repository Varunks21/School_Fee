from sqlalchemy import Column, Integer

from app.core.database import Base


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, nullable=False)
    fee_component_id = Column(Integer, nullable=False)
    allocated_amount = Column(Integer, nullable=False, default=0)
