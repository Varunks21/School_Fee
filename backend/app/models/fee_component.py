from sqlalchemy import Column, Integer, String

from app.core.database import Base


class FeeComponent(Base):
    __tablename__ = "fee_components"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
