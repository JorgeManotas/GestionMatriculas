import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session, joinedload

from app import models, schemas


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
