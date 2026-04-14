from sqlalchemy.orm import Session, joinedload

from app.models.class_fee import ClassFee
from app.models.class_model import ClassModel
from app.models.fee_component import FeeComponent


def create_fee_component(db: Session, name: str) -> FeeComponent:
    component = FeeComponent(name=name)
    db.add(component)
    db.commit()
    db.refresh(component)
    return component


def get_fee_components(db: Session) -> list[FeeComponent]:
    return db.query(FeeComponent).order_by(FeeComponent.name.asc()).all()


def get_class(db: Session, class_id: int) -> ClassModel | None:
    return db.query(ClassModel).filter(ClassModel.id == class_id).first()


def get_class_by_name(db: Session, name: str) -> ClassModel | None:
    return db.query(ClassModel).filter(ClassModel.name.ilike(name)).first()


def create_class(db: Session, name: str) -> ClassModel:
    school_class = ClassModel(name=name)
    db.add(school_class)
    db.commit()
    db.refresh(school_class)
    return school_class


def replace_class_fee_structure(db: Session, class_id: int, fees: list[dict]) -> list[ClassFee]:
    db.query(ClassFee).filter(ClassFee.class_id == class_id).delete()
    records = [
        ClassFee(
            class_id=class_id,
            fee_component_id=fee["component_id"],
            amount=fee["amount"],
            priority=fee["priority"],
        )
        for fee in fees
    ]
    db.add_all(records)
    db.commit()
    return get_class_fee_structure(db, class_id)


def get_class_fee_structure(db: Session, class_id: int) -> list[ClassFee]:
    return (
        db.query(ClassFee)
        .options(joinedload(ClassFee.fee_component))
        .filter(ClassFee.class_id == class_id)
        .order_by(ClassFee.priority.asc(), ClassFee.id.asc())
        .all()
    )
