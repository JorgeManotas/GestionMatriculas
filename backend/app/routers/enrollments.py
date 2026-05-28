from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db


router = APIRouter(prefix="/enrollments", tags=["Matriculas"])


@router.post("", response_model=schemas.EnrollmentRead, status_code=201)
def post_enrollment(payload: schemas.EnrollmentCreate, db: Session = Depends(get_db)) -> schemas.EnrollmentRead:
    return crud.create_enrollment(db, payload)
