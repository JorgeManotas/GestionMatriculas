import uuid
from decimal import Decimal
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db


router = APIRouter(tags=["Pagos"])
UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "payment-receipts"
ALLOWED_RECEIPT_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}


@router.get("/guardians/{guardian_id}/payments", response_model=schemas.GuardianPaymentSummary)
def get_guardian_payments(guardian_id: uuid.UUID, db: Session = Depends(get_db)) -> schemas.GuardianPaymentSummary:
    return crud.get_guardian_payment_summary(db, guardian_id)


@router.post("/payments", response_model=schemas.PaymentRead, status_code=201)
def post_payment(payload: schemas.PaymentCreate, db: Session = Depends(get_db)) -> schemas.PaymentRead:
    return crud.create_payment(db, payload)


@router.post("/payments/report", response_model=schemas.PaymentReportRead, status_code=201)
async def report_payment(
    student_id: uuid.UUID = Form(...),
    amount: Decimal = Form(...),
    installments: int = Form(...),
    receipt: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> schemas.PaymentReportRead:
    extension = Path(receipt.filename or "").suffix.lower()
    if extension not in ALLOWED_RECEIPT_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El comprobante debe estar en formato .pdf, .jpg, .jpeg o .png.",
        )

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4()}{extension}"
    target_path = UPLOAD_DIR / filename
    target_path.write_bytes(await receipt.read())
    receipt_url = f"/uploads/payment-receipts/{filename}"

    report = crud.create_payment_report(db, student_id, amount, installments, receipt_url)
    student = crud.get_user_or_404(db, report.student_id)
    return schemas.PaymentReportRead(
        id=report.id,
        student_id=student.id,
        student_name=f"{student.first_name} {student.last_name}",
        student_document=(student.role_attributes or {}).get("estudiante", {}).get("documento_identidad") or student.document_number,
        amount=report.amount,
        installments=report.installments,
        receipt_url=report.receipt_url,
        status=report.status,
        created_at=report.created_at,
        reviewed_by=report.reviewed_by,
    )


@router.get("/payments/reports/pending", response_model=list[schemas.PaymentReportRead])
def get_pending_payment_reports(db: Session = Depends(get_db)) -> list[schemas.PaymentReportRead]:
    return crud.list_payment_reports(db, "pending")


@router.patch("/payments/{report_id}/verify", response_model=schemas.PaymentReportRead)
def verify_payment_report(
    report_id: uuid.UUID,
    payload: schemas.PaymentReportVerify,
    db: Session = Depends(get_db),
) -> schemas.PaymentReportRead:
    return crud.verify_payment_report(db, report_id, payload)
