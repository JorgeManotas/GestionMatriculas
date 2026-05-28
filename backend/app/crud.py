import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

from app import models, schemas


DEFAULT_INITIAL_PASSWORD = "User12345*"
REQUIRED_BULK_COLUMNS = {"first_name", "last_name", "email", "document_number", "role"}


def list_roles(db: Session) -> list[models.Role]:
    return list(db.scalars(select(models.Role).order_by(models.Role.name)).all())


def list_users(db: Session) -> list[models.User]:
    stmt = select(models.User).options(joinedload(models.User.roles)).order_by(models.User.created_at.desc())
    return list(db.scalars(stmt).unique().all())


def get_user_or_404(db: Session, user_id: uuid.UUID) -> models.User:
    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")
    return user


def authenticate_user(db: Session, payload: schemas.AuthLogin) -> schemas.AuthUserRead:
    stmt = select(models.User).options(joinedload(models.User.roles)).where(models.User.email == str(payload.email).lower())
    user = db.scalars(stmt).unique().one_or_none()

    if not user or not user.is_active or user.password_hash != payload.password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales invalidas.")

    role_names = [role.name for role in user.roles]
    primary_role = _resolve_primary_role(role_names)
    return schemas.AuthUserRead(
        id=user.id,
        full_name=f"{user.first_name} {user.last_name}",
        email=user.email,
        role=primary_role,
        roles=role_names,
        avatar_initials=f"{user.first_name[:1]}{user.last_name[:1]}".upper(),
        role_attributes=user.role_attributes,
        document_number=user.document_number,
    )


def _resolve_primary_role(role_names: list[str]) -> str:
    priority = ["ADMIN", "RECTOR", "SECRETARY", "TEACHER", "GUARDIAN", "STUDENT"]
    normalized = {role.upper() for role in role_names}
    for role in priority:
        if role in normalized:
            return role
    return role_names[0].upper() if role_names else "STUDENT"


def create_user(db: Session, payload: schemas.UserCreate) -> models.User:
    roles = list(db.scalars(select(models.Role).where(models.Role.name.in_(payload.role_names))).all())
    found_role_names = {role.name for role in roles}
    missing_roles = sorted(set(payload.role_names) - found_role_names)
    if missing_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Roles inexistentes: {', '.join(missing_roles)}.",
        )

    user = models.User(
        first_name=payload.first_name.strip(),
        last_name=payload.last_name.strip(),
        email=str(payload.email).lower(),
        password_hash=payload.password,
        document_number=payload.document_number,
        role_attributes=payload.role_attributes,
        roles=roles,
    )

    try:
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un usuario con ese correo o documento.",
        ) from exc
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="No fue posible crear el usuario.") from exc


def bulk_create_users(db: Session, rows: list[dict[str, str]]) -> schemas.BulkUploadResult:
    errors: list[str] = []
    created = 0
    skipped = 0

    for index, row in enumerate(rows, start=2):
        missing = [column for column in REQUIRED_BULK_COLUMNS if not str(row.get(column, "")).strip()]
        if missing:
            errors.append(f"Fila {index}: faltan columnas obligatorias: {', '.join(missing)}.")
            skipped += 1
            continue

        role_name = str(row["role"]).strip().upper()
        role = db.scalar(select(models.Role).where(models.Role.name == role_name))
        if not role:
            errors.append(f"Fila {index}: rol inexistente '{role_name}'.")
            skipped += 1
            continue

        email = str(row["email"]).strip().lower()
        exists = db.scalar(select(models.User.id).where(models.User.email == email))
        if exists:
            errors.append(f"Fila {index}: el correo {email} ya existe.")
            skipped += 1
            continue

        user = models.User(
            first_name=str(row["first_name"]).strip(),
            last_name=str(row["last_name"]).strip(),
            email=email,
            document_number=str(row.get("document_number", "")).strip() or None,
            password_hash=DEFAULT_INITIAL_PASSWORD,
            role_attributes=_build_role_attributes_from_bulk_row(row, role_name),
            roles=[role],
        )
        db.add(user)
        created += 1

    try:
        db.commit()
        return schemas.BulkUploadResult(created=created, skipped=skipped, errors=errors)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="El archivo contiene documentos o correos duplicados.") from exc
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="No fue posible procesar la carga masiva.") from exc


def _build_role_attributes_from_bulk_row(row: dict[str, str], role_name: str) -> dict:
    if role_name == "TEACHER":
        course = str(row.get("curso", "")).strip()
        subject = str(row.get("materia", "")).strip()
        return {"docente": {"materias": [{"curso": course, "nombre": subject}] if course and subject else []}}
    if role_name == "STUDENT":
        return {
            "estudiante": {
                "documento_identidad": str(row.get("document_number", "")).strip(),
                "acudiente_id": str(row.get("acudiente_id", "")).strip(),
            }
        }
    return {}


def create_enrollment(db: Session, payload: schemas.EnrollmentCreate) -> models.Enrollment:
    student = get_user_or_404(db, payload.student_id)
    guardian = get_user_or_404(db, payload.guardian_id)
    course = db.get(models.Course, payload.course_id)

    if not course:
        raise HTTPException(status_code=404, detail="Curso no encontrado.")

    student_roles = {role.name for role in student.roles}
    guardian_roles = {role.name for role in guardian.roles}
    if "STUDENT" not in student_roles:
        raise HTTPException(status_code=400, detail="El usuario estudiante no tiene rol STUDENT.")
    if "GUARDIAN" not in guardian_roles:
        raise HTTPException(status_code=400, detail="El acudiente no tiene rol GUARDIAN.")

    enrollment_data = {
        "student_id": payload.student_id,
        "guardian_id": payload.guardian_id,
        "course_id": payload.course_id,
        "notes": payload.notes,
    }
    if payload.enrollment_date:
        enrollment_data["enrollment_date"] = payload.enrollment_date

    enrollment = models.Enrollment(
        **enrollment_data,
    )

    try:
        db.add(enrollment)
        db.commit()
        db.refresh(enrollment)
        return enrollment
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="El estudiante ya esta matriculado en ese curso.") from exc
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="No fue posible crear la matricula.") from exc


def get_guardian_payment_summary(db: Session, guardian_id: uuid.UUID) -> schemas.GuardianPaymentSummary:
    guardian = get_user_or_404(db, guardian_id)

    # Aggregate payments by monthly fee so partial payments can be represented without duplicating rows.
    paid_subquery = (
        select(
            models.Payment.monthly_fee_id.label("monthly_fee_id"),
            func.coalesce(func.sum(models.Payment.amount), 0).label("paid_amount"),
        )
        .group_by(models.Payment.monthly_fee_id)
        .subquery()
    )

    stmt = (
        select(
            models.MonthlyFee,
            models.Enrollment,
            models.User,
            models.Course,
            func.coalesce(paid_subquery.c.paid_amount, 0).label("paid_amount"),
        )
        .join(models.Enrollment, models.MonthlyFee.enrollment_id == models.Enrollment.id)
        .join(models.User, models.Enrollment.student_id == models.User.id)
        .join(models.Course, models.Enrollment.course_id == models.Course.id)
        .outerjoin(paid_subquery, paid_subquery.c.monthly_fee_id == models.MonthlyFee.id)
        .where(models.Enrollment.guardian_id == guardian_id)
        .order_by(models.MonthlyFee.due_date.asc())
    )

    fees: list[schemas.GuardianFeeRead] = []
    total_pending = Decimal("0")
    total_overdue = Decimal("0")

    for monthly_fee, enrollment, student, course, paid_amount in db.execute(stmt).all():
        paid = Decimal(paid_amount or 0)
        balance = max(Decimal(monthly_fee.amount) - paid, Decimal("0"))
        if monthly_fee.status == "PENDING":
            total_pending += balance
        if monthly_fee.status == "OVERDUE":
            total_overdue += balance

        fees.append(
            schemas.GuardianFeeRead(
                monthly_fee_id=monthly_fee.id,
                enrollment_id=enrollment.id,
                student_id=student.id,
                student_name=f"{student.first_name} {student.last_name}",
                course_name=course.name,
                period=monthly_fee.period,
                amount=monthly_fee.amount,
                due_date=monthly_fee.due_date,
                status=monthly_fee.status,
                paid_amount=paid,
                balance=balance,
                grade=course.grade,
                monthly_fee_amount=course.monthly_fee_amount,
                enrollment_fee_amount=course.enrollment_fee_amount,
            )
        )

    return schemas.GuardianPaymentSummary(
        guardian_id=guardian.id,
        guardian_name=f"{guardian.first_name} {guardian.last_name}",
        total_pending=total_pending,
        total_overdue=total_overdue,
        fees=fees,
    )


def create_payment(db: Session, payload: schemas.PaymentCreate) -> models.Payment:
    monthly_fee = db.get(models.MonthlyFee, payload.monthly_fee_id)
    payer = db.get(models.User, payload.paid_by_user_id)

    if not monthly_fee:
        raise HTTPException(status_code=404, detail="Mensualidad no encontrada.")
    if not payer:
        raise HTTPException(status_code=404, detail="Usuario pagador no encontrado.")

    total_paid = db.scalar(
        select(func.coalesce(func.sum(models.Payment.amount), 0)).where(models.Payment.monthly_fee_id == payload.monthly_fee_id)
    )
    new_total = Decimal(total_paid or 0) + payload.amount

    if new_total > monthly_fee.amount:
        raise HTTPException(status_code=400, detail="El pago supera el saldo de la mensualidad.")

    payment = models.Payment(**payload.model_dump())
    monthly_fee.status = "PAID" if new_total == monthly_fee.amount else "PENDING"

    try:
        db.add(payment)
        db.commit()
        db.refresh(payment)
        return payment
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="La referencia de pago ya existe.") from exc
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="No fue posible registrar el pago.") from exc


def create_payment_report(
    db: Session,
    student_id: uuid.UUID,
    amount: Decimal,
    installments: int,
    receipt_url: str,
) -> models.PaymentReport:
    student = get_user_or_404(db, student_id)
    if "STUDENT" not in {role.name for role in student.roles}:
        raise HTTPException(status_code=400, detail="El usuario seleccionado no es estudiante.")
    if installments <= 0:
        raise HTTPException(status_code=400, detail="El numero de cuotas debe ser mayor a cero.")

    report = models.PaymentReport(
        student_id=student_id,
        amount=amount,
        installments=installments,
        receipt_url=receipt_url,
        status="pending",
    )

    try:
        db.add(report)
        db.commit()
        db.refresh(report)
        return report
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="No fue posible reportar el pago.") from exc


def list_payment_reports(db: Session, status_filter: str = "pending") -> list[schemas.PaymentReportRead]:
    stmt = (
        select(models.PaymentReport, models.User)
        .join(models.User, models.PaymentReport.student_id == models.User.id)
        .where(models.PaymentReport.status == status_filter)
        .order_by(models.PaymentReport.created_at.desc())
    )

    return [
        schemas.PaymentReportRead(
            id=report.id,
            student_id=student.id,
            student_name=f"{student.first_name} {student.last_name}",
            student_document=_student_document(student),
            amount=report.amount,
            installments=report.installments,
            receipt_url=report.receipt_url,
            status=report.status,
            created_at=report.created_at,
            reviewed_by=report.reviewed_by,
        )
        for report, student in db.execute(stmt).all()
    ]


def verify_payment_report(db: Session, report_id: uuid.UUID, payload: schemas.PaymentReportVerify) -> schemas.PaymentReportRead:
    report = db.get(models.PaymentReport, report_id)
    reviewer = get_user_or_404(db, payload.reviewed_by)
    reviewer_roles = {role.name for role in reviewer.roles}

    if not report:
        raise HTTPException(status_code=404, detail="Reporte de pago no encontrado.")
    if not reviewer_roles.intersection({"ADMIN", "RECTOR", "SECRETARY"}):
        raise HTTPException(status_code=403, detail="El usuario no tiene permisos para verificar pagos.")

    report.status = payload.status
    report.reviewed_by = payload.reviewed_by

    try:
        db.commit()
        db.refresh(report)
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="No fue posible verificar el pago.") from exc

    student = get_user_or_404(db, report.student_id)
    return schemas.PaymentReportRead(
        id=report.id,
        student_id=student.id,
        student_name=f"{student.first_name} {student.last_name}",
        student_document=_student_document(student),
        amount=report.amount,
        installments=report.installments,
        receipt_url=report.receipt_url,
        status=report.status,
        created_at=report.created_at,
        reviewed_by=report.reviewed_by,
    )


def _student_document(student: models.User) -> str | None:
    attributes = student.role_attributes or {}
    return attributes.get("estudiante", {}).get("documento_identidad") or student.document_number
