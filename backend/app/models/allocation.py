from sqlalchemy import Column, ForeignKey, Integer, Numeric
from sqlalchemy.orm import relationship

from app.core.database import Base


class Allocation(Base):
    __tablename__ = "payment_allocations"

    id = Column("allocation_id", Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.payment_id"), nullable=False)
    class_fee_id = Column(Integer, ForeignKey("class_fee_structure.id"), nullable=False)
    fee_component_id = Column("component_id", Integer, ForeignKey("fee_components.component_id"), nullable=False)
    allocated_amount = Column(Numeric(10, 2), nullable=False, default=0)

    payment = relationship("Payment", back_populates="allocations")
    class_fee = relationship("ClassFee", back_populates="allocations")
    fee_component = relationship("FeeComponent", back_populates="allocations")
