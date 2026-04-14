from sqlalchemy import Column, Integer, String

from app.core.database import Base


class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    admission_no = Column(String, unique=True, nullable=False)
