import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class RoleRead(BaseModel):
    id: int
    name: str
    description: str

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    first_name: str = Field(min_length=2, max_length=100)
    last_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=80)
    document_number: str | None = Field(default=None, max_length=40)
    role_names: list[str] = Field(min_length=1)
    role_attributes: dict[str, Any] = Field(default_factory=dict)

    @field_validator("role_names")
    @classmethod
    def normalize_roles(cls, value: list[str]) -> list[str]:
        roles = [role.strip().upper() for role in value if role.strip()]
        if not roles:
            raise ValueError("Debe asignar al menos un rol valido.")
        return sorted(set(roles))


class UserRead(BaseModel):
    id: uuid.UUID
    first_name: str
    last_name: str
    email: EmailStr
    document_number: str | None
    is_active: bool
    role_attributes: dict[str, Any]
    roles: list[RoleRead]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=80)


class AuthUserRead(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    role: str
    roles: list[str]
    avatar_initials: str
    role_attributes: dict[str, Any]
    document_number: str | None = None


class BulkUploadResult(BaseModel):
    created: int
    skipped: int
    errors: list[str]


class CourseRead(BaseModel):
    id: int
    name: str
    grade: str
    academic_year: int
    monthly_fee_amount: Decimal

    model_config = ConfigDict(from_attributes=True)


class EnrollmentCreate(BaseModel):
    student_id: uuid.UUID
    guardian_id: uuid.UUID
    course_id: int
    enrollment_date: date | None = None
    notes: str | None = None


class EnrollmentRead(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    guardian_id: uuid.UUID
    course_id: int
    enrollment_date: date
    status: str
    notes: str | None

    model_config = ConfigDict(from_attributes=True)


class PaymentCreate(BaseModel):
    monthly_fee_id: uuid.UUID
    paid_by_user_id: uuid.UUID
    amount: Decimal = Field(gt=0)
    method: str = Field(min_length=3, max_length=40)
    reference: str | None = Field(default=None, max_length=100)
    notes: str | None = None


class PaymentRead(BaseModel):
    id: uuid.UUID
    monthly_fee_id: uuid.UUID
    paid_by_user_id: uuid.UUID
    amount: Decimal
    payment_date: datetime
    method: str
    reference: str | None
    notes: str | None

    model_config = ConfigDict(from_attributes=True)


class GuardianFeeRead(BaseModel):
    monthly_fee_id: uuid.UUID
    enrollment_id: uuid.UUID
    student_id: uuid.UUID
    student_name: str
    course_name: str
    period: str
    amount: Decimal
    due_date: date
    status: str
    paid_amount: Decimal
    balance: Decimal
    grade: str
    monthly_fee_amount: Decimal
    enrollment_fee_amount: Decimal


class GuardianPaymentSummary(BaseModel):
    guardian_id: uuid.UUID
    guardian_name: str
    total_pending: Decimal
    total_overdue: Decimal
    fees: list[GuardianFeeRead]


class PaymentReportRead(BaseModel):
    id: uuid.UUID
    student_id: uuid.UUID
    student_name: str
    student_document: str | None
    amount: Decimal
    installments: int
    receipt_url: str
    status: str
    created_at: datetime
    reviewed_by: uuid.UUID | None


class PaymentReportVerify(BaseModel):
    status: str = Field(pattern="^(approved|rejected)$")
    reviewed_by: uuid.UUID
