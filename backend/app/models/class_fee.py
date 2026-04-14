from sqlalchemy import Column, ForeignKey, Integer, Numeric
from sqlalchemy.orm import relationship

from app.core.database import Base


class ClassFee(Base):
    __tablename__ = "class_fee_structure"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.class_id"), nullable=False)
    fee_component_id = Column("component_id", Integer, ForeignKey("fee_components.component_id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False, default=0)
    priority = Column(Integer, nullable=False, default=1)

    class_model = relationship("ClassModel", back_populates="fee_structures")
    fee_component = relationship("FeeComponent", back_populates="class_fees")
    allocations = relationship("Allocation", back_populates="class_fee")
