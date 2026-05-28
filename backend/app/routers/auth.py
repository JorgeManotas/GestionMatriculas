from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import crud, schemas
from app.database import get_db


router = APIRouter(prefix="/auth", tags=["Autenticacion"])


@router.post("/login", response_model=schemas.AuthUserRead)
def login(payload: schemas.AuthLogin, db: Session = Depends(get_db)) -> schemas.AuthUserRead:
    return crud.authenticate_user(db, payload)
