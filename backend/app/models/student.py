from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column("student_id", Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    section = Column(String(10), nullable=False, default="A")
    admission_no = Column(String(50), unique=True, nullable=False)
    class_id = Column(Integer, ForeignKey("classes.class_id"), nullable=False)
    parent_name = Column(String(100), nullable=False, default="Unknown")
    parent_contact_number = Column(String(15), nullable=False, default="0000000000")

    student_class = relationship("ClassModel", back_populates="students")
    payments = relationship("Payment", back_populates="student")
