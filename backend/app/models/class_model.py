from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class ClassModel(Base):
    __tablename__ = "classes"

    id = Column("class_id", Integer, primary_key=True, index=True)
    name = Column("class_name", String(20), nullable=False, unique=True)
    students = relationship("Student", back_populates="student_class")
    fee_structures = relationship(
        "ClassFee",
        back_populates="class_model",
        cascade="all, delete-orphan",
    )
