from sqlalchemy import Column, Integer

from app.core.database import Base


class ClassFee(Base):
    __tablename__ = "class_fees"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, nullable=False)
    fee_component_id = Column(Integer, nullable=False)
    amount = Column(Integer, nullable=False, default=0)
