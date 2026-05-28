import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db


router = APIRouter(tags=["Pagos"])


@router.get("/guardians/{guardian_id}/payments", response_model=schemas.GuardianPaymentSummary)
def get_guardian_payments(guardian_id: uuid.UUID, db: Session = Depends(get_db)) -> schemas.GuardianPaymentSummary:
    return crud.get_guardian_payment_summary(db, guardian_id)


@router.post("/payments", response_model=schemas.PaymentRead, status_code=201)
def post_payment(payload: schemas.PaymentCreate, db: Session = Depends(get_db)) -> schemas.PaymentRead:
    return crud.create_payment(db, payload)
