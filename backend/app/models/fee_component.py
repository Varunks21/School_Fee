from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class FeeComponent(Base):
    __tablename__ = "fee_components"

    id = Column("component_id", Integer, primary_key=True, index=True)
    name = Column("component_name", String(100), nullable=False, unique=True)
    priority = Column(Integer, nullable=False, default=1)
    class_fees = relationship("ClassFee", back_populates="fee_component")
    allocations = relationship("Allocation", back_populates="fee_component")
